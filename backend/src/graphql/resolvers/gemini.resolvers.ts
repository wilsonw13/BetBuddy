import GeminiService from "@/services/gemini.service";

export const geminiResolvers = {
  Query: {
    geminiSuggestBets: async (_: any, { userInterests, pastBets }: any) => {
      return await GeminiService.suggestBets(userInterests, pastBets);
    },
  },
  Mutation: {
    geminiVerifyBetPhoto: async (_: any, { imageUrl, betContext }: any) => {
      // imageUrl can be a remote URL or local path
      const result = await GeminiService.verifyBetPhoto(imageUrl, betContext);
      return result;
    },
  },
};
