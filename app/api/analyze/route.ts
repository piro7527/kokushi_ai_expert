import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";



// Next.js App Router config
export const maxDuration = 60; // seconds

interface Correction {
    question: string;
    options: string[];
    userCorrectAnswer: string;
}

function loadCorrections(): Correction[] {
    try {
        const filePath = path.join(process.cwd(), "data", "corrections.json");
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading corrections:", error);
        return [];
    }
}

function buildFewShotExamples(corrections: Correction[]): string {
    if (corrections.length === 0) return "";

    // Use last 5 corrections as examples to avoid prompt getting too long
    const recentCorrections = corrections.slice(-5);

    let examples = "\n\n以下は過去の正しい回答例です。参考にしてください：\n";
    recentCorrections.forEach((c, i) => {
        examples += `\n例${i + 1}:\n問題: ${c.question}\n正解: ${c.userCorrectAnswer}\n`;
    });

    return examples;
}

export async function POST(request: Request) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            console.error("Request body parse error:", parseError);
            return NextResponse.json(
                { error: "Invalid request body. Please try with a smaller image." },
                { status: 400 }
            );
        }

        const { image } = body;

        if (!image) {
            return NextResponse.json(
                { error: "Image data is required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        console.log("API Key Configured:", !!apiKey); // Debug log
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-1.5-pro-latest for highest accuracy in exam question analysis
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

        // Extract MIME type and base64 data
        const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);

        let mimeType = "image/jpeg";
        let base64Data = image;

        if (matches && matches.length === 3) {
            mimeType = matches[1];
            base64Data = matches[2];
        } else {
            // Fallback or assume raw base64 without prefix
            // You might want to do stricter validation here
        }

        // Load corrections for few-shot learning
        const corrections = loadCorrections();
        const fewShotExamples = buildFewShotExamples(corrections);
        console.log(`Loaded ${corrections.length} corrections for few-shot learning`);

        const prompt = `
      あなたは理学療法士国家試験の専門家です。
      提供された画像を解析し、問題文、選択肢、正解、そして詳細な解説を提供してください。
      出力は以下のJSON形式のみを含めてください（Markdownのコードブロックは不要です）：
      {
        "questionNumber": "画像に記載されている問題番号（例: 89, 90など）",
        "question": "問題文のテキスト",
        "options": ["選択肢1", "選択肢2", ...],
        "correctAnswer": ["正解の選択肢のテキスト1", "正解の選択肢のテキスト2"],
        "explanation": "なぜその答えが正しいのか、他の選択肢がなぜ誤りなのかの詳細な解説"
      }
      
      重要: 
      1. questionNumberは画像に記載されている実際の問題番号を正確に抽出してください。
      2. correctAnswerは必ず配列（Array）形式で返してください。正解が1つの場合も ["正解"] のように配列にしてください。
      3. 複数の問題がある場合は配列で返してください。
      ${fewShotExamples}
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = await result.response;
        let text = response.text();

        // Debug: Log raw response
        console.log("Raw AI Response:", text);

        // Clean up markdown code blocks if present to ensure valid JSON parsing
        // Handle various formats: ```json, ```JSON, ``` json, etc.
        text = text.replace(/```\s*json\s*/gi, "").replace(/```/g, "").trim();

        // Fix invalid escape sequences in JSON (e.g., LaTeX commands like \text, \times)
        function fixInvalidEscapes(str: string): string {
            // Valid JSON escape sequences: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
            // We need to escape backslashes that are NOT part of these valid sequences
            return str.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
        }

        // Try to extract JSON from the response if it contains other text
        function extractJSON(str: string): string {
            // Try to find JSON array first (prefer arrays for multiple questions)
            const arrayStart = str.indexOf('[');
            const arrayEnd = str.lastIndexOf(']');
            if (arrayStart !== -1 && arrayEnd > arrayStart) {
                const candidate = str.substring(arrayStart, arrayEnd + 1);
                try {
                    // Test parse with escape fix
                    JSON.parse(fixInvalidEscapes(candidate));
                    return candidate;
                } catch {
                    // Continue to object match
                }
            }

            // Try to find JSON object
            const objectStart = str.indexOf('{');
            const objectEnd = str.lastIndexOf('}');
            if (objectStart !== -1 && objectEnd > objectStart) {
                const candidate = str.substring(objectStart, objectEnd + 1);
                try {
                    JSON.parse(fixInvalidEscapes(candidate));
                    return candidate;
                } catch {
                    // Return original
                }
            }

            return str;
        }

        // Extract JSON from the response
        let jsonText = extractJSON(text);

        jsonText = fixInvalidEscapes(jsonText);
        console.log("Extracted JSON:", jsonText.substring(0, 500) + (jsonText.length > 500 ? "..." : ""));

        try {
            let data = JSON.parse(jsonText);
            // Debug: Log parsed data
            console.log("Parsed Data:", JSON.stringify(data, null, 2));

            // Normalize data to always be an array of questions
            let questions: any[] = [];

            if (Array.isArray(data)) {
                // Already an array
                questions = data;
            } else if (typeof data === 'object' && data !== null) {
                // Check if it's an object with question numbers as keys (e.g., {"89": {...}, "90": {...}})
                const keys = Object.keys(data);
                if (keys.length > 0 && keys.every(k => /^\d+$/.test(k) || data[k].question)) {
                    // Object with numbered keys - convert to array, preserving numbers
                    questions = Object.entries(data)
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                        .map(([key, value]: [string, any]) => ({
                            ...value,
                            questionNumber: value.questionNumber || key
                        }));
                } else if (data.question) {
                    // Single question object
                    questions = [data];
                } else {
                    questions = [data];
                }
            }

            console.log("Returning", questions.length, "questions");

            return NextResponse.json({ questions });
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            console.error("Original text:", text);
            console.error("Extracted JSON attempt:", jsonText);
            return NextResponse.json(
                {
                    error: "Failed to parse AI response",
                    rawText: text.substring(0, 1000),
                    hint: "AIの応答がJSON形式ではありませんでした。もう一度お試しください。"
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Error analyzing image:", error);
        return NextResponse.json(
            { error: `Failed to analyze image: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
