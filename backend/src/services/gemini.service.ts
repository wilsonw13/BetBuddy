import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";

const API_KEY_for_text = process.env.GEMINI_API_KEY_TEXT || "";
const genAI_for_text = new GoogleGenerativeAI(API_KEY_for_text);

const API_KEY_for_image = process.env.GEMINI_API_KEY_IMAGE || "";
const genAI_for_image = new GoogleGenerativeAI(API_KEY_for_image);

export interface PhotoVerificationResult {
  isSuspicious: boolean;
  confidence: number;
  reason: string;
  suggestions: string[];
}

export async function verifyBetPhoto(imagePathOrUrl: string, betContext: string): Promise<PhotoVerificationResult> {
  try {
    const model = genAI_for_image.getGenerativeModel({ model: "gemini-2.5-flash" });
    const imageBase64 = await imageToBase64(imagePathOrUrl);
    const prompt = `You are a bet verification assistant. Analyze this image to determine if it's legitimate proof for a bet about: "${betContext}".\n\nLook for signs that this photo might be:\n1. A screenshot from the internet\n2. An old photo being reused\n3. Not actually showing the claimed activity\n4. Manipulated or edited\n5. Not matching the bet requirements\n\nRespond in JSON format with:\n{\n  "isSuspicious": boolean,\n  "confidence": number (0-1),\n  "reason": "Brief explanation",\n  "suggestions": ["suggestion1", "suggestion2"]\n}\n\nBecause you are verifying a single instance, you are not to care about frequency in the betting.\nThese photos are also generally not meant to be selfies, so you should not hold the fact that the bettor is not in the picture against them.\nEssentially, you are only supposed to care that the apparent location of the picture is an appropriate place to complete the bet.\n\nBe strict but fair. If the photo looks legitimate, mark it as not suspicious.`;
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const verification: PhotoVerificationResult = JSON.parse(jsonMatch[0]);
      return verification;
    }
    return {
      isSuspicious: false,
      confidence: 0.5,
      reason: "Unable to fully analyze the image",
      suggestions: ["Manual verification recommended"],
    };
  } catch (error) {
    console.error("Error verifying photo with Gemini:", error);
    return {
      isSuspicious: false,
      confidence: 0,
      reason: "Verification service unavailable",
      suggestions: ["Please verify manually"],
    };
  }
}

export async function suggestBets(userInterests: string[], pastBets: string[]): Promise<string[]> {
  try {
    const model = genAI_for_text.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are a bet suggestion assistant. Based on these user interests: ${userInterests.join(", ")} and past bets: ${pastBets.join(", ")}, suggest 5 creative and achievable bet ideas.\n\nRequirements:\n- Bets should be measurable and verifiable\n- Include a mix of fitness, productivity, and lifestyle activities\n- Make them challenging but achievable\n- Avoid repeating past bets exactly\n\nReturn ONLY a JSON array of strings, like:\n["Bet idea 1", "Bet idea 2", "Bet idea 3", "Bet idea 4", "Bet idea 5. Keep your Suggestions Short, 30 characters max."]`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const suggestions: string[] = JSON.parse(jsonMatch[0]);
      return suggestions;
    }
    return [
      "Go to gym 3x per week",
      "Read for 30 minutes daily",
      "Cook at home 5 days a week",
      "Run 10 miles per week",
      "Meditate 10 minutes daily",
    ];
  } catch (error) {
    console.error("Error generating bet suggestions:", error);
    return [
      "Go to gym 3x per week",
      "Read for 30 minutes daily",
      "Cook at home 5 days a week",
      "Run 10 miles per week",
      "Meditate 10 minutes daily",
    ];
  }
}

export async function imageToBase64(imagePathOrUrl: string): Promise<string> {
  if (imagePathOrUrl.startsWith("http")) {
    const response = await fetch(imagePathOrUrl);
    const buffer = await response.buffer();
    return buffer.toString("base64");
  } else {
    const buffer = await fs.readFile(path.resolve(imagePathOrUrl));
    return buffer.toString("base64");
  }
}

export default {
  verifyBetPhoto,
  suggestBets,
};
