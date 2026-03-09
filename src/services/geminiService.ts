import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getPreparednessGuidance(disaster: string, location: string, weatherInfo: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a disaster preparedness assistant for Quezon City, Philippines. 
      Provide VERY SHORT, concise, and actionable preparedness guidance for a ${disaster} in ${location}. 
      Current weather context: ${weatherInfo}. 
      Focus ONLY on:
      1. Essential Go Bag items (3-4 items max).
      2. One key evacuation reminder.
      DO NOT include emergency contacts or repeat the current weather information.
      Keep it under 60 words. Format with simple bullet points (using - or •). 
      DO NOT USE ASTERISKS (*) FOR BOLDING OR LISTING.`,
    });
    return response.text.replace(/\*/g, '');
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Unable to load personalized AI guidance. Please follow standard QC DRRMO protocols.";
  }
}
