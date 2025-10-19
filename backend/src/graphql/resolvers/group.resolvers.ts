import { GraphQLError } from "graphql";
import { prisma } from "@/config/prisma";
import { Context } from "@types";

export const groupResolvers = {
  Query: {
    myBetGroups: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const groups = await prisma.betGroup.findMany({
        where: {
          OR: [
            { ownerId: context.user.userId },
            {
              members: {
                some: {
                  userId: context.user.userId,
                },
              },
            },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
            },
          },
          members: {
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
          bets: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return groups;
    },

    betGroup: async (_: any, { id }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const group = await prisma.betGroup.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
            },
          },
          members: {
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
          bets: true,
        },
      });

      if (!group) {
        throw new GraphQLError("Bet group not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return group;
    },
  },

  Mutation: {
    createBetGroup: async (_: any, { input }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const { name, description, memberDisplayNames } = input;

      let users: any[] = [];

      // Find users by displayName if memberDisplayNames is provided and not empty
      if (memberDisplayNames && memberDisplayNames.length > 0) {
        users = await prisma.user.findMany({
          where: {
            displayName: {
              in: memberDisplayNames,
            },
          },
        });

        if (users.length !== memberDisplayNames.length) {
          throw new GraphQLError("One or more display names not found", {
            extensions: { code: "USER_NOT_FOUND" },
          });
        }
      }

      // Always include the owner in the members list
      const owner = await prisma.user.findUnique({
        where: { id: context.user.userId },
      });

      if (!owner) {
        throw new GraphQLError("Owner not found", {
          extensions: { code: "USER_NOT_FOUND" },
        });
      }

      // Add owner to users if not already included
      if (!users.some((user) => user.id === owner.id)) {
        users.push(owner);
      }

      // Create group with members (including owner)
      const group = await prisma.betGroup.create({
        data: {
          name,
          description,
          ownerId: context.user.userId,
          members: {
            create: users.map((user) => ({
              userId: user.id,
            })),
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
            },
          },
          members: {
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
          bets: true,
        },
      });

      return group;
    },

    addGroupMembers: async (_: any, { groupId, displayNames }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const group = await prisma.betGroup.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        throw new GraphQLError("Bet group not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (group.ownerId !== context.user.userId) {
        throw new GraphQLError("Only group owner can add members", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      // Find all users by displayName
      const users = await prisma.user.findMany({
        where: {
          displayName: {
            in: displayNames,
          },
        },
      });

      if (users.length !== displayNames.length) {
        throw new GraphQLError("One or more display names not found", {
          extensions: { code: "USER_NOT_FOUND" },
        });
      }

      // Add members
      await prisma.betGroupMember.createMany({
        data: users.map((user) => ({
          groupId,
          userId: user.id,
        })),
        skipDuplicates: true,
      });

      const updatedGroup = await prisma.betGroup.findUnique({
        where: { id: groupId },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
            },
          },
          members: {
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
          bets: true,
        },
      });

      // Create notifications for newly added members
      const owner = await prisma.user.findUnique({
        where: { id: context.user.userId },
      });

      if (users.length > 0) {
        console.log(
          "Creating notifications for users:",
          users.map((u) => u.displayName),
        );
        console.log("prisma.notification exists?", !!prisma.notification);
        console.log(
          "prisma.notification.createMany exists?",
          !!(prisma.notification && prisma.notification.createMany),
        );

        try {
          await prisma.notification.createMany({
            data: users.map((user) => ({
              userId: user.id,
              type: "group_invite",
              title: "Added to Bet Group",
              message: `${owner?.displayName || "Someone"} added you to the group: ${group.name}`,
              metadata: {
                groupId: group.id,
                groupName: group.name,
                ownerId: group.ownerId,
              },
            })),
          });
          console.log("Notifications created successfully");
        } catch (notifError) {
          console.error("Failed to create notifications:", notifError);
          // Don't fail the whole operation if notification creation fails
        }
      }

      return updatedGroup;
    },

    removeGroupMember: async (_: any, { groupId, userId }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const group = await prisma.betGroup.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        throw new GraphQLError("Bet group not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (group.ownerId !== context.user.userId) {
        throw new GraphQLError("Only group owner can remove members", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      await prisma.betGroupMember.deleteMany({
        where: {
          groupId,
          userId,
        },
      });

      return {
        success: true,
        message: "Member removed from group",
      };
    },

    updateBetGroup: async (_: any, { groupId, name, description }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const group = await prisma.betGroup.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        throw new GraphQLError("Bet group not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (group.ownerId !== context.user.userId) {
        throw new GraphQLError("Only group owner can update group", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      const updatedGroup = await prisma.betGroup.update({
        where: { id: groupId },
        data: updateData,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
            },
          },
          members: {
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
          bets: true,
        },
      });

      return updatedGroup;
    },

    leaveGroup: async (_: any, { groupId }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const group = await prisma.betGroup.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        throw new GraphQLError("Bet group not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (group.ownerId === context.user.userId) {
        throw new GraphQLError("Owner cannot leave group. Please delete the group or transfer ownership first.", {
          extensions: { code: "INVALID_OPERATION" },
        });
      }

      await prisma.betGroupMember.deleteMany({
        where: {
          groupId,
          userId: context.user.userId,
        },
      });

      return {
        success: true,
        message: "Left group successfully",
      };
    },

    deleteGroup: async (_: any, { groupId }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const group = await prisma.betGroup.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        throw new GraphQLError("Bet group not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (group.ownerId !== context.user.userId) {
        throw new GraphQLError("Only group owner can delete group", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      await prisma.betGroup.delete({
        where: { id: groupId },
      });

      return {
        success: true,
        message: "Group deleted successfully",
      };
    },
  },
};
