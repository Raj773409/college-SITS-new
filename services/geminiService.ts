import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateAIResponse = async (prompt: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI Service is currently unavailable (Missing API Key).";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful, encouraging, and academic AI assistant for computer science students at Siddhartha Institute of Science and Technology (SITS). Keep answers concise, accurate, and professional.",
      }
    });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Something went wrong while contacting the AI tutor.";
  }
};

export const generateJSON = async (prompt: string): Promise<any> => {
    const ai = getClient();
    if (!ai) return null;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Gemini API Error (JSON):", error);
      return null;
    }
  };