const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function listModels() {
    try {
        const envPath = path.resolve(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error(".env.local not found");
            return;
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);
        const apiKey = match ? match[1].trim() : null;

        if (!apiKey) {
            console.error("API Key not found in .env.local");
            return;
        }

        console.log("Using Key ending in:", apiKey.slice(-4));

        const genAI = new GoogleGenerativeAI(apiKey);

        const candidates = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-002",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-1.5-pro-001",
            "gemini-1.5-pro-002",
            "gemini-1.5-pro-latest",
            "gemini-pro"
        ];

        console.log("Testing models...");
        for (const name of candidates) {
            process.stdout.write(`Checking ${name}... `);
            try {
                const m = genAI.getGenerativeModel({ model: name });
                // Simple text generation to verify access
                await m.generateContent("Hello");
                console.log(`OK`);
            } catch (e) {
                console.log(`FAIL: ${e.message.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
