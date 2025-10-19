import { GraphQLError } from "graphql";
import { prisma } from "@/config/prisma";
import { Context } from "@types";

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

      // Check if user is a participant in the bet
      const isParticipant = await prisma.betParticipant.findFirst({
        where: {
          betId: betProof.betId,
          userId: context.user.userId,
        },
      });

      if (!isParticipant) {
        throw new GraphQLError(
          "Only bet participants can review proof submissions",
          {
            extensions: { code: "UNAUTHORIZED" },
          }
        );
      }

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

      return review;
    },
  },
};
