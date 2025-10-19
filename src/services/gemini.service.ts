export interface PhotoVerificationResult {
  isSuspicious: boolean;
  confidence: number;
  reason: string;
  suggestions: string[];
}

import { gql } from "@apollo/client";
import { apolloClient } from "../config/apolloClient";

export async function verifyBetPhoto(imageUrl: string, betContext: string): Promise<PhotoVerificationResult> {
  const mutation = gql`
    mutation GeminiVerifyBetPhoto($imageUrl: String!, $betContext: String!) {
      geminiVerifyBetPhoto(imageUrl: $imageUrl, betContext: $betContext)
    }
  `;
  const { data } = await apolloClient.mutate({
    mutation,
    variables: { imageUrl, betContext },
  });
  return data.geminiVerifyBetPhoto;
}

export async function suggestBets(userInterests: string[], pastBets: string[]): Promise<string[]> {
  const query = gql`
    query GeminiSuggestBets($userInterests: [String!]!, $pastBets: [String!]!) {
      geminiSuggestBets(userInterests: $userInterests, pastBets: $pastBets)
    }
  `;
  const { data } = await apolloClient.query({
    query,
    variables: { userInterests, pastBets },
  });
  return data.geminiSuggestBets;
}

export default {
  verifyBetPhoto,
  suggestBets,
};
