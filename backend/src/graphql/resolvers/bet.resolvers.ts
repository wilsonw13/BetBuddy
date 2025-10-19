import { GraphQLError } from "graphql";
import { prisma } from "@/config/prisma";
import { Context } from "@types";

export const betResolvers = {
  Query: {
    myBets: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const bets = await prisma.bet.findMany({
        where: {
          OR: [
            { creatorId: context.user.userId },
            {
              participants: {
                some: {
                  userId: context.user.userId,
                },
              },
            },
          ],
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
            },
          },
          group: true,
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profileImage: true,
                },
              },
            },
          },
          proofs: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return bets;
    },

    pendingBets: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const bets = await prisma.bet.findMany({
        where: {
          status: "pending",
          participants: {
            some: {
              userId: context.user.userId,
              status: "pending",
            },
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
            },
          },
          group: true,
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profileImage: true,
                },
              },
            },
          },
          proofs: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return bets;
    },

    activeBets: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const bets = await prisma.bet.findMany({
        where: {
          status: "active",
          OR: [
            { creatorId: context.user.userId },
            {
              participants: {
                some: {
                  userId: context.user.userId,
                },
              },
            },
          ],
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
            },
          },
          group: true,
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profileImage: true,
                },
              },
            },
          },
          proofs: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return bets;
    },

    completedBets: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const bets = await prisma.bet.findMany({
        where: {
          status: "completed",
          OR: [
            { creatorId: context.user.userId },
            {
              participants: {
                some: {
                  userId: context.user.userId,
                },
              },
            },
          ],
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
            },
          },
          group: true,
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profileImage: true,
                },
              },
            },
          },
          proofs: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return bets;
    },

    bet: async (_: any, { id }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const bet = await prisma.bet.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
            },
          },
          group: true,
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profileImage: true,
                },
              },
            },
          },
          proofs: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      });

      if (!bet) {
        throw new GraphQLError("Bet not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return bet;
    },
  },

  Mutation: {
    createBet: async (_: any, { input }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const {
        title,
        description,
        betActivity,
        proofType,
        frequency,
        betLength,
        pointsStaked,
        startDate,
        participantDisplayNames,
        groupId,
      } = input;

      // Validate that either participantDisplayNames or groupId is provided
      if (!participantDisplayNames && !groupId) {
        throw new GraphQLError("Either participantDisplayNames or groupId must be provided", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Calculate end date
      const start = new Date(startDate);
      const end = new Date(start.getTime() + betLength * 24 * 60 * 60 * 1000);

      let participants: any[] = [];

      // If groupId is provided, get all members from the group
      if (groupId) {
        const group = await prisma.betGroup.findUnique({
          where: { id: groupId },
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        });

        if (!group) {
          throw new GraphQLError("Bet group not found", {
            extensions: { code: "GROUP_NOT_FOUND" },
          });
        }

        // Add all group members as participants, plus the creator if not already in group
        participants = group.members.map((member) => member.user);

        // Check if creator is in the group members
        const creatorInGroup = participants.some((p) => p.id === context.user!.userId);
        if (!creatorInGroup) {
          const creator = await prisma.user.findUnique({
            where: { id: context.user!.userId },
          });
          if (creator) {
            participants.push(creator);
          }
        }
      } else if (participantDisplayNames && participantDisplayNames.length > 0) {
        // Find all participants by displayName
        participants = await prisma.user.findMany({
          where: {
            displayName: {
              in: participantDisplayNames,
            },
          },
        });

        if (participants.length !== participantDisplayNames.length) {
          throw new GraphQLError("One or more participant display names not found", {
            extensions: { code: "USER_NOT_FOUND" },
          });
        }

        // Ensure creator is included in participants
        const creatorIncluded = participants.some((p) => p.id === context.user!.userId);
        if (!creatorIncluded) {
          const creator = await prisma.user.findUnique({
            where: { id: context.user!.userId },
          });
          if (creator) {
            participants.push(creator);
          }
        }
      }

      // Create bet with participants
      const bet = await prisma.bet.create({
        data: {
          title,
          description,
          betActivity,
          proofType,
          frequency,
          betLength,
          pointsReward: pointsStaked,
          startDate: start,
          endDate: end,
          status: "pending",
          creatorId: context.user!.userId,
          groupId,
          isGroupBet: !!groupId,
          participants: {
            create: participants.map((participant: { id: string }) => ({
              userId: participant.id,
              status: participant.id === context.user!.userId ? "accepted" : "pending",
              acceptedAt: participant.id === context.user!.userId ? new Date() : null,
            })),
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
            },
          },
          group: true,
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profileImage: true,
                },
              },
            },
          },
          proofs: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      });

      // Create notifications for all participants except creator
      const creator = await prisma.user.findUnique({
        where: { id: context.user!.userId },
      });

      const participantsToNotify = participants.filter((p: { id: string }) => p.id !== context.user!.userId);

      if (participantsToNotify.length > 0) {
        await prisma.notification.createMany({
          data: participantsToNotify.map((participant: { id: string }) => ({
            userId: participant.id,
            type: "bet_invite",
            title: "New Bet Invitation",
            message: `${creator?.displayName || "Someone"} invited you to a bet: ${bet.title}`,
            metadata: {
              betId: bet.id,
              creatorId: context.user!.userId,
              betTitle: bet.title,
              pointsStaked: pointsStaked,
              frequency: bet.frequency,
              betLength: bet.betLength,
            },
          })),
        });
      }

      return bet;
    },

    cancelBet: async (_: any, { betId }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const bet = await prisma.bet.findUnique({
        where: { id: betId },
      });

      if (!bet) {
        throw new GraphQLError("Bet not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (bet.creatorId !== context.user.userId) {
        throw new GraphQLError("Only bet creator can cancel the bet", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      if (bet.status === "active" || bet.status === "completed") {
        throw new GraphQLError("Cannot cancel an active or completed bet", {
          extensions: { code: "INVALID_STATUS" },
        });
      }

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
        message: "Bet cancelled",
      };
    },
  },
};
