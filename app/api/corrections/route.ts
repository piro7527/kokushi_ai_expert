import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CORRECTIONS_FILE = path.join(process.cwd(), "data", "corrections.json");

interface Correction {
    id: string;
    question: string;
    options: string[];
    aiAnswer: string;
    userCorrectAnswer: string;
    aiExplanation?: string;
    userExplanation?: string;
    createdAt: string;
}

function loadCorrections(): Correction[] {
    try {
        if (!fs.existsSync(CORRECTIONS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(CORRECTIONS_FILE, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading corrections:", error);
        return [];
    }
}

function saveCorrections(corrections: Correction[]): void {
    const dir = path.dirname(CORRECTIONS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CORRECTIONS_FILE, JSON.stringify(corrections, null, 2));
}

export async function GET() {
    const corrections = loadCorrections();
    return NextResponse.json({ corrections, count: corrections.length });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { question, options, aiAnswer, userCorrectAnswer, aiExplanation, userExplanation } = body;

        if (!question || !userCorrectAnswer) {
            return NextResponse.json(
                { error: "Question and userCorrectAnswer are required" },
                { status: 400 }
            );
        }

        const corrections = loadCorrections();

        const newCorrection: Correction = {
            id: `corr_${Date.now()}`,
            question,
            options: options || [],
            aiAnswer: aiAnswer || "",
            userCorrectAnswer,
            aiExplanation: aiExplanation || "",
            userExplanation: userExplanation || "",
            createdAt: new Date().toISOString(),
        };

        corrections.push(newCorrection);
        saveCorrections(corrections);

        console.log(`Correction saved: ${newCorrection.id}`);

        return NextResponse.json({
            success: true,
            correction: newCorrection,
            totalCorrections: corrections.length
        });
    } catch (error) {
        console.error("Error saving correction:", error);
        return NextResponse.json(
            { error: "Failed to save correction" },
            { status: 500 }
        );
    }
}
