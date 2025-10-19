import { GraphQLError } from "graphql";
import { prisma } from "@/config/prisma";
import { Context } from "@types";

export const betParticipantResolvers = {
  Mutation: {
    acceptBet: async (_: any, { betId }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

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

      if (participant.status !== "pending") {
        throw new GraphQLError("Bet already processed", {
          extensions: { code: "BET_PROCESSED" },
        });
      }

      // Update participant status
      await prisma.betParticipant.update({
        where: { id: participant.id },
        data: {
          status: "accepted",
          acceptedAt: new Date(),
        },
      });

      // Check if all participants have accepted
      const allParticipants = await prisma.betParticipant.findMany({
        where: { betId },
      });

      const allAccepted = allParticipants.every((p) => p.status === "accepted");

      // If all accepted, update bet status to active and delete all notifications
      if (allAccepted) {
        await prisma.bet.update({
          where: { id: betId },
          data: { status: "active" },
        });

        // Delete all bet invite notifications since everyone accepted
        await prisma.notification.deleteMany({
          where: {
            type: "bet_invite",
            metadata: {
              path: ["betId"],
              equals: betId,
            },
          },
        });
      } else {
        // Delete only this user's notification
        await prisma.notification.deleteMany({
          where: {
            userId: context.user.userId,
            type: "bet_invite",
            metadata: {
              path: ["betId"],
              equals: betId,
            },
          },
        });
      }

      return {
        success: true,
        message: allAccepted ? "Bet is now active!" : "Bet accepted",
      };
    },

    declineBet: async (_: any, { betId }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

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

      if (participant.status !== "pending") {
        throw new GraphQLError("Bet already processed", {
          extensions: { code: "BET_PROCESSED" },
        });
      }

      // Update participant status to declined
      await prisma.betParticipant.update({
        where: { id: participant.id },
        data: { status: "declined" },
      });

      // Update bet status to cancelled since someone declined
      await prisma.bet.update({
        where: { id: betId },
        data: { status: "cancelled" },
      });

      // Delete all bet invite notifications for this bet for all users
      await prisma.notification.deleteMany({
        where: {
          type: "bet_invite",
          metadata: {
            path: ["betId"],
            equals: betId,
          },
        },
      });

      return {
        success: true,
        message: "Bet declined",
      };
    },
  },
};
