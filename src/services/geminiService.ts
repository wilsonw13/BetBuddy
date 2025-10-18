import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini AI
// IMPORTANT: Replace with your actual API key or use environment variables
const API_KEY = "AIzaSyBW7eZfYb0_p9uIj5jBMTF5N30T0xZE6ow";
const genAI = new GoogleGenerativeAI(API_KEY);

export interface PhotoVerificationResult {
  isSuspicious: boolean;
  confidence: number;
  reason: string;
  suggestions: string[];
}

/**
 * Verify a photo for bet proof using Gemini AI
 * @param imageUri - The URI of the image to verify
 * @param betContext - Context about the bet (e.g., "gym workout", "running")
 * @returns Verification result with suspicious flag and reasoning
 */
export async function verifyBetPhoto(imageUri: string, betContext: string): Promise<PhotoVerificationResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert image to base64 (in a real app, you'd fetch and convert the image)
    const imageBase64 = await imageUriToBase64(imageUri);

    const prompt = `You are a bet verification assistant. Analyze this image to determine if it's legitimate proof for a bet about: "${betContext}".

Look for signs that this photo might be:
1. A screenshot from the internet
2. An old photo being reused
3. Not actually showing the claimed activity
4. Manipulated or edited
5. Not matching the bet requirements

Respond in JSON format with:
{
  "isSuspicious": boolean,
  "confidence": number (0-1),
  "reason": "Brief explanation",
  "suggestions": ["suggestion1", "suggestion2"]
}

Be strict but fair. If the photo looks legitimate, mark it as not suspicious.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const verification: PhotoVerificationResult = JSON.parse(jsonMatch[0]);
      return verification;
    }

    // Fallback if parsing fails
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

/**
 * Suggest bet ideas based on user interests and activity history
 * @param userInterests - Array of user interests
 * @param pastBets - Array of past bet activities
 * @returns Array of suggested bet activities
 */
export async function suggestBets(userInterests: string[], pastBets: string[]): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a bet suggestion assistant. Based on these user interests: ${userInterests.join(
      ", ",
    )} and past bets: ${pastBets.join(", ")}, suggest 5 creative and achievable bet ideas.

Requirements:
- Bets should be measurable and verifiable
- Include a mix of fitness, productivity, and lifestyle activities
- Make them challenging but achievable
- Avoid repeating past bets exactly

Return ONLY a JSON array of strings, like:
["Bet idea 1", "Bet idea 2", "Bet idea 3", "Bet idea 4", "Bet idea 5"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const suggestions: string[] = JSON.parse(jsonMatch[0]);
      return suggestions;
    }

    // Fallback suggestions
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

/**
 * Convert image URI to base64 string
 * @param uri - Image URI
 * @returns Base64 encoded string
 */
async function imageUriToBase64(uri: string): Promise<string> {
  try {
    // In React Native with Expo, you can use FileSystem
    // For now, this is a placeholder
    // You'll need to implement actual image fetching and conversion

    // Example using fetch:
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw error;
  }
}

export default {
  verifyBetPhoto,
  suggestBets,
};
