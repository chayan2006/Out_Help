import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

async function testGemini() {
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    console.log("Testing with API Key:", apiKey ? "FOUND" : "MISSING");

    if (!apiKey) return;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        console.log("Sending prompt to Gemini...");
        const result = await model.generateContent("Say 'Hello, I am working!'");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (error) {
        console.error("Gemini Test Error:", error);
    }
}

testGemini();
