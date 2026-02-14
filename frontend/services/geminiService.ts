import { GoogleGenerativeAI } from "@google/generative-ai";
import { MASTER_SERVICES } from "../constants/services";

// Initialize the API with the key from environment variables (client-side)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

const SERVICES_CONTEXT = MASTER_SERVICES.map(s =>
  `- ${s.name} (${s.category}): $${s.basePrice}. ${s.description}`
).join('\n');

const SYSTEM_INSTRUCTION = `You are the TrustServe AI Agent, an advanced assistant for India's leading home service platform. 

YOUR MISSION:
You are a proactive service concierge. Your goal is to convert user interest into a booking.

KNOWLEDGE BASE (SERVICES):
${SERVICES_CONTEXT}

AGENT FLOW RULES:
1. IMMEDIATE IDENTIFICATION: If a user mentions a problem (e.g., "my sink is broken"), immediately identify the correct service (e.g., Plumbing) and say: "I can help with that! I'll book our Expert Plumbing service for you. What is your location?"
2. SKIP THE SMALL TALK: Be professional but highly efficient.
3. CONSTRAINTS FIRST: Always prioritize getting Location and Date/Time as soon as a service is identified.
4. MULTI-LINGUAL EXPERTISE: Fluently respond in English, Hindi, or Hinglish to match the user.
5. SUMMARY & CLOSING: Once details are collected, summarize exactly: "Service: [Name], Price: $[Price], Location: [Loc], Time: [Time]. Proceed?"

TONE: Energetic, intelligent, and premium. ⚡🏠🇮🇳`;

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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const sendMessageToChat = async (chat: any, message: string, userId?: string): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: [], userId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || "Backend Error");
    }
    const data = await response.json();
    return data.response;
  } catch (error: any) {
    console.error("Chat Error:", error);
    return `Error: ${error.message}. Please check backend logs.`;
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

    const responseText = await result.response.text();
    return responseText || "Could not analyze images.";
  } catch (error) {
    console.error("Vision Error:", error);
    return "Error analyzing images. Standard manual verification may be required.";
  }
};

