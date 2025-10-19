import { GraphQLError } from "graphql";
import { prisma } from "@/config/prisma";
import { Context } from "@types";

// Helper function to check and finalize proof verification
async function checkAndFinalizeProofVerification(betProofId: string, betId: string) {
  // Get all reviews for this proof
  const reviews = await prisma.betProofReview.findMany({
    where: { betProofId },
  });

  // Get total number of participants in the bet
  const participantCount = await prisma.betParticipant.count({
    where: { betId },
  });

  const requiredReviews = participantCount - 1; // total bettors - 1

  console.log(`📊 Proof verification check:`, {
    betProofId,
    reviewCount: reviews.length,
    requiredReviews,
    participantCount,
  });

  // If we have enough reviews (total bettors - 1), use majority vote
  if (reviews.length >= requiredReviews && requiredReviews > 0) {
    const accepts = reviews.filter((r) => !r.isSuspicious).length;
    const rejects = reviews.filter((r) => r.isSuspicious).length;

    const isVerified = accepts > rejects; // Majority vote

    console.log(`✅ Using majority vote:`, {
      accepts,
      rejects,
      isVerified,
    });

    // Update the proof with the majority decision
    await prisma.betProof.update({
      where: { id: betProofId },
      data: {
        verified: isVerified,
        verifiedBy: "community_vote",
      },
    });
  } else {
    // Not enough reviews, use AI suggestion if available
    const betProof = await prisma.betProof.findUnique({
      where: { id: betProofId },
    });

    if (betProof && betProof.aiSuggestionSuspicious !== null) {
      const isVerified = !betProof.aiSuggestionSuspicious;

      console.log(`🤖 Using Gemini API decision:`, {
        aiSuggestionSuspicious: betProof.aiSuggestionSuspicious,
        isVerified,
      });

      // Update the proof with AI decision
      await prisma.betProof.update({
        where: { id: betProofId },
        data: {
          verified: isVerified,
          verifiedBy: "gemini_api",
        },
      });
    } else {
      console.log(`⏳ Waiting for more reviews or AI analysis`);
    }
  }
}

export const betProofReviewResolvers = {
  BetProof: {
    reviews: async (parent: any) => {
      return prisma.betProofReview.findMany({
        where: { betProofId: parent.id },
        include: {
          reviewer: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
              bannerImage: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    },
  },

  BetProofReview: {
    betProof: async (parent: any) => {
      return prisma.betProof.findUnique({
        where: { id: parent.betProofId },
        include: {
          bet: true,
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
              bannerImage: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    },
    reviewer: async (parent: any) => {
      return prisma.user.findUnique({
        where: { id: parent.reviewerId },
      });
    },
  },

  Query: {
    betProofReviews: async (_: any, { betProofId }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      // Verify the bet proof exists and user has access to it
      const betProof = await prisma.betProof.findUnique({
        where: { id: betProofId },
        include: { bet: true },
      });

      if (!betProof) {
        throw new GraphQLError("Bet proof not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      // Check if user is a participant in the bet
      const isParticipant = await prisma.betParticipant.findFirst({
        where: {
          betId: betProof.betId,
          userId: context.user.userId,
        },
      });

      if (!isParticipant) {
        throw new GraphQLError("You are not authorized to view these reviews", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      return prisma.betProofReview.findMany({
        where: { betProofId },
        include: {
          reviewer: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
              bannerImage: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    },
  },

  Mutation: {
    submitBetProofReview: async (
      _: any,
      { input }: any,
      context: Context
    ) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const { betProofId, isSuspicious, reason, confidence } = input;

      // Get the bet proof with bet information
      const betProof = await prisma.betProof.findUnique({
        where: { id: betProofId },
        include: {
          bet: true,
        },
      });

      if (!betProof) {
        throw new GraphQLError("Bet proof not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      // Check if user is trying to review their own proof
      if (betProof.userId === context.user.userId) {
        throw new GraphQLError(
          "You cannot review your own bet proof",
          {
            extensions: { code: "UNAUTHORIZED" },
          }
        );
      }

      // Reviews are now global - anyone can review (removed participant restriction)

      // Check if user has already reviewed this proof
      const existingReview = await prisma.betProofReview.findUnique({
        where: {
          betProofId_reviewerId: {
            betProofId,
            reviewerId: context.user.userId,
          },
        },
      });

      if (existingReview) {
        throw new GraphQLError("You have already reviewed this bet proof", {
          extensions: { code: "CONFLICT" },
        });
      }

      // Create the review
      const review = await prisma.betProofReview.create({
        data: {
          betProofId,
          reviewerId: context.user.userId,
          isSuspicious,
          reason,
          confidence,
        },
        include: {
          reviewer: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
              bannerImage: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      // Check if we should finalize the proof verification
      await checkAndFinalizeProofVerification(betProofId, betProof.betId);

      return review;
    },
  },
};
