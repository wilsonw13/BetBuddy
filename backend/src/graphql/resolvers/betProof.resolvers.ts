import { GraphQLError } from "graphql";
import { prisma } from "@/config/prisma";
import { Context } from "@types";

export const betProofResolvers = {
  BetProof: {
    // Map database field 'image' to GraphQL field 'imageUrl'
    imageUrl: (parent: any) => parent.image,
  },

  Mutation: {
    submitProof: async (_: any, { input }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const {
        betId,
        proofType,
        imageUrl,
        latitude,
        longitude,
        address,
        aiSuggestionSuspicious,
        aiSuggestionReason,
        aiSuggestionConfidence,
      } = input;

      // Check if user is participant in bet
      const participant = await prisma.betParticipant.findFirst({
        where: {
          betId,
          userId: context.user.userId,
        },
      });

      if (!participant) {
        throw new GraphQLError("You are not a participant in this bet", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      // Create proof
      const proof = await prisma.betProof.create({
        data: {
          betId,
          userId: context.user.userId,
          proofType,
          image: imageUrl, // store as image in DB, but use imageUrl from input
          latitude,
          longitude,
          address,
          aiSuggestionSuspicious,
          aiSuggestionReason,
          aiSuggestionConfidence,
          verified: false,
        },
        include: {
          bet: true,
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
            },
          },
        },
      });

      // Return proof with imageUrl field for frontend compatibility
      return {
        ...proof,
        imageUrl: proof.image,
      };
    },

    verifyProof: async (_: any, { proofId, verified }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const proof = await prisma.betProof.findUnique({
        where: { id: proofId },
        include: {
          bet: true,
        },
      });

      if (!proof) {
        throw new GraphQLError("Proof not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      // Check if user is the bet creator or a participant
      const isCreator = proof.bet.creatorId === context.user.userId;
      const isParticipant = await prisma.betParticipant.findFirst({
        where: {
          betId: proof.betId,
          userId: context.user.userId,
        },
      });

      if (!isCreator && !isParticipant) {
        throw new GraphQLError("You are not authorized to verify this proof", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      const updatedProof = await prisma.betProof.update({
        where: { id: proofId },
        data: {
          verified,
          verifiedBy: context.user.userId,
        },
        include: {
          bet: true,
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
            },
          },
        },
      });

      return updatedProof;
    },
  },
};
