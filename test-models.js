const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        // There isn't a direct listModels method on the client instance in some versions, 
        // but let's try to just run a generation on a few common names to see which one works.

        const candidates = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-002",
            "gemini-1.5-flash-8b",
            "gemini-1.5-pro",
            "gemini-1.5-pro-001",
            "gemini-1.5-pro-002",
            "gemini-1.0-pro",
            "gemini-pro",
            "gemini-flash-latest",
            "gemini-pro-latest"
        ];

        for (const name of candidates) {
            console.log(`Testing model: ${name}`);
            try {
                const m = genAI.getGenerativeModel({ model: name });
                const result = await m.generateContent("Hello");
                console.log(`SUCCESS: ${name}`);
                return;
            } catch (e) {
                console.log(`FAILED: ${name} - ${e.message}`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

listModels();
