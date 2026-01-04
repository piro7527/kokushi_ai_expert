
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is not set");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // Note: listModels is on the genAI instance or model manager depending on SDK version
        // In newer SDKs:
        // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // But we want to list. 
        // Actually, looking at docs, there isn't a direct listModels on the main class in some versions,
        // but let's try the common pattern or just try to instantiate 001.

        // Let's try to just output what we can find or test a specific model
        console.log("Testing gemini-1.5-flash-001...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        const result = await model.generateContent("Hello");
        console.log("gemini-1.5-flash-001 is working:", result.response.text());
    } catch (error) {
        console.error("Error:", error.message);
    }

    try {
        console.log("Testing gemini-2.0-flash-exp...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent("Hello");
        console.log("gemini-2.0-flash-exp is working:", result.response.text());
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();
