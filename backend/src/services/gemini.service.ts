import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import fs from "fs/promises";
import fetch from "node-fetch";

// Load .env.local if present
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

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
    console.log("🤖 Calling Gemini API for bet suggestions...");
    const model = genAI_for_text.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 1.5,
        topP: 0.95,
        topK: 64,
      },
    });

    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 1000000);
    const prompt = `You are a bet suggestion assistant. Based on these user interests: ${userInterests.join(", ")} and past bets: ${pastBets.join(", ")}, suggest 5 creative and achievable bet ideas.

Requirements:
- Bets should be measurable and verifiable
- Include a mix of fitness, productivity, and lifestyle activities
- Make them challenging but achievable
- Avoid repeating past bets exactly
- IMPORTANT: Generate completely different suggestions each time
- Be creative and think outside the box
- Context: ${randomSeed}-${timestamp}

Return ONLY a JSON array of strings:
["Bet idea 1", "Bet idea 2", "Bet idea 3", "Bet idea 4", "Bet idea 5"]

Keep each suggestion under 35 characters.`;

    console.log("📤 Sending request to Gemini...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log("📥 Gemini response:", text);

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const suggestions: string[] = JSON.parse(jsonMatch[0]);
      console.log("✅ Parsed suggestions:", suggestions);
      return suggestions;
    }

    console.warn("⚠️ No JSON array found, using fallback");
    return [
      "Go to gym 3x per week",
      "Read for 30 minutes daily",
      "Cook at home 5 days a week",
      "Run 10 miles per week",
      "Meditate 10 minutes daily",
    ];
  } catch (error) {
    console.error("❌ Error generating bet suggestions:", error);
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
  // Handle base64 data URLs (data:image/jpeg;base64,...)
  if (imagePathOrUrl.startsWith("data:")) {
    const base64Data = imagePathOrUrl.split(",")[1];
    return base64Data;
  }

  // Handle HTTP/HTTPS URLs
  if (imagePathOrUrl.startsWith("http")) {
    const response = await fetch(imagePathOrUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString("base64");
  }

  // Handle local file paths (though this won't work for mobile app file:// URIs)
  const buffer = await fs.readFile(path.resolve(imagePathOrUrl));
  return buffer.toString("base64");
}

export default {
  verifyBetPhoto,
  suggestBets,
};
