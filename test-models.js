
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is not set");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        console.log("Testing gemini-2.0-flash-lite...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const result = await model.generateContent("Hello");
        console.log("gemini-2.0-flash-lite is working:", result.response.text());
    } catch (error) {
        console.error("gemini-2.0-flash-lite error:", error.message);
    }

    try {
        console.log("Testing gemini-flash-latest...");
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Hello");
        console.log("gemini-flash-latest is working:", result.response.text());
    } catch (error) {
        console.error("gemini-flash-latest error:", error.message);
    }
}

listModels();
