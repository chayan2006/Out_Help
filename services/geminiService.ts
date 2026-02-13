import { GoogleGenerativeAI } from "@google/generative-ai";
import { MASTER_SERVICES } from "../constants/services";

// Initialize the API with the key from environment variables (client-side)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

const SERVICES_CONTEXT = MASTER_SERVICES.map(s =>
  `- ${s.name} (${s.category}): $${s.basePrice}. ${s.description}`
).join('\n');

const SYSTEM_INSTRUCTION = `You are TrustServe Assistant, an expert AI for the TrustServe home service platform.

YOUR KNOWLEDGE BASE (SERVICES OFFERED):
${SERVICES_CONTEXT}

YOUR RULES:
1. Help users book these services using natural language.
2. NATIVE MULTI-LINGUAL: Always reply in the same language/style the user uses (English, Hindi, or Hinglish).
3. Be an expert: If asked about prices or what a service involves, use the information above.
4. Extract constraints: If they don't mention a location or time, ask for them politely.
5. If they confirm a booking details, summarize it: "The [Service] will cost $[Price]. Please confirm if I should proceed with your booking for [Time] at [Location]."
6. Tone: Helpful, professional, and friendly. Use emojis where appropriate. 🇮🇳`;

export const createChatSession = () => {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION
  });

  return model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: 500,
    },
  });
};

export const sendMessageToChat = async (chat: any, message: string): Promise<string> => {
  try {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text() || "I'm sorry, I didn't catch that.";
  } catch (error) {
    console.error("Chat Error:", error);
    if ((error as any).message?.includes("API_KEY_INVALID")) {
      return "Oops! The AI needs a valid API key to work. Please check the VITE_GEMINI_API_KEY setting.";
    }
    return "Sorry, I'm having trouble connecting to Gemini. Please try again or book directly via the services tab.";
  }
};

// Vision for Quality Assurance
export const analyzeQuality = async (beforeImageBase64: string, afterImageBase64: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const prompt = "Analyze these 'Before' and 'After' photos for a home service quality check. Identify work done, rate the improvement 0-100, and give brief reasons.";

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: 'image/jpeg', data: beforeImageBase64 } },
      { inlineData: { mimeType: 'image/jpeg', data: afterImageBase64 } }
    ]);

    const response = await result.response;
    return response.text() || "Could not analyze images.";
  } catch (error) {
    console.error("Vision Error:", error);
    return "Error analyzing images. Standard manual verification may be required.";
  }
};

