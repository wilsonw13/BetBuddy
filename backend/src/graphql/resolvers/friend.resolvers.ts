import { GraphQLError } from "graphql";
import { prisma } from "@/config/prisma";
import { Context } from "@types";

export const friendResolvers = {
  Query: {
    myFriends: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      // Debug: log the query
      // eslint-disable-next-line no-console
      console.debug("myFriends query for userId:", context.user.userId);

      // Get friendships where user is either user1 or user2
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [{ user1Id: context.user.userId }, { user2Id: context.user.userId }],
        },
        include: {
          user1: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
              createdAt: true,
            },
          },
          user2: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
              createdAt: true,
            },
          },
        },
      });

      // Debug: log results
      // eslint-disable-next-line no-console
      console.debug("Found friendships:", friendships.length);
      // eslint-disable-next-line no-console
      console.debug("Friendships data:", JSON.stringify(friendships, null, 2));

      // Return the friend (not the current user)
      const friends = friendships.map((friendship) =>
        friendship.user1Id === context.user?.userId ? friendship.user2 : friendship.user1,
      );

      // Debug: log mapped friends
      // eslint-disable-next-line no-console
      console.debug("Mapped friends:", JSON.stringify(friends, null, 2));

      return friends;
    },

    myFriendRequests: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      // Debug: log the query
      // eslint-disable-next-line no-console
      console.debug("myFriendRequests query for userId:", context.user.userId);

      const requests = await prisma.friendRequest.findMany({
        where: {
          toUserId: context.user.userId,
          status: "pending",
        },
        include: {
          fromUser: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          toUser: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Debug: log results
      // eslint-disable-next-line no-console
      console.debug("Found friend requests:", requests.length);

      return requests;
    },

    sentFriendRequests: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      // Debug: log the query
      // eslint-disable-next-line no-console
      console.debug("sentFriendRequests query for userId:", context.user.userId);

      const requests = await prisma.friendRequest.findMany({
        where: {
          fromUserId: context.user.userId,
          status: "pending",
        },
        include: {
          fromUser: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          toUser: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Debug: log results
      // eslint-disable-next-line no-console
      console.debug("Found sent friend requests:", requests.length);

      return requests;
    },
  },

  Mutation: {
    sendFriendRequest: async (_: any, { toDisplayName }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      // Debug: log friend request attempt
      // eslint-disable-next-line no-console
      console.debug("sendFriendRequest:", {
        fromUserId: context.user.userId,
        toDisplayName,
      });

      // Find the user by displayName
      const toUser = await prisma.user.findUnique({
        where: { displayName: toDisplayName },
      });

      if (!toUser) {
        throw new GraphQLError("User not found", {
          extensions: { code: "USER_NOT_FOUND" },
        });
      }

      if (toUser.id === context.user.userId) {
        throw new GraphQLError("Cannot send friend request to yourself", {
          extensions: { code: "INVALID_REQUEST" },
        });
      }

      // Check if already friends
      const existingFriendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: context.user.userId, user2Id: toUser.id },
            { user1Id: toUser.id, user2Id: context.user.userId },
          ],
        },
      });

      if (existingFriendship) {
        throw new GraphQLError("Already friends with this user", {
          extensions: { code: "ALREADY_FRIENDS" },
        });
      }

      // Check if friend request already exists
      const existingRequest = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { fromUserId: context.user.userId, toUserId: toUser.id },
            { fromUserId: toUser.id, toUserId: context.user.userId },
          ],
          status: "pending",
        },
      });

      if (existingRequest) {
        throw new GraphQLError("Friend request already sent", {
          extensions: { code: "REQUEST_EXISTS" },
        });
      }

      // Create friend request
      const friendRequest = await prisma.friendRequest.create({
        data: {
          fromUserId: context.user.userId,
          toUserId: toUser.id,
        },
        include: {
          fromUser: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          toUser: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      // Create notification for friend request
      const fromUser = await prisma.user.findUnique({
        where: { id: context.user.userId },
      });

      await prisma.notification.create({
        data: {
          userId: toUser.id,
          type: "friend_request",
          title: "New Friend Request",
          message: `${fromUser?.displayName || "Someone"} sent you a friend request`,
          metadata: {
            friendRequestId: friendRequest.id,
            fromUserId: context.user.userId,
          },
        },
      });

      return friendRequest;
    },

    acceptFriendRequest: async (_: any, { requestId }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const friendRequest = await prisma.friendRequest.findUnique({
        where: { id: requestId },
      });

      if (!friendRequest) {
        throw new GraphQLError("Friend request not found", {
          extensions: { code: "REQUEST_NOT_FOUND" },
        });
      }

      if (friendRequest.toUserId !== context.user.userId) {
        throw new GraphQLError("Not authorized to accept this request", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      if (friendRequest.status !== "pending") {
        throw new GraphQLError("Friend request already processed", {
          extensions: { code: "REQUEST_PROCESSED" },
        });
      }

      // Debug: log before creating friendship
      // eslint-disable-next-line no-console
      console.debug("acceptFriendRequest - creating friendship:", {
        user1Id: friendRequest.fromUserId,
        user2Id: friendRequest.toUserId,
        requestId,
      });

      // Create friendship and update request status in a transaction
      const result = await prisma.$transaction([
        prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: "accepted" },
        }),
        prisma.friendship.create({
          data: {
            user1Id: friendRequest.fromUserId,
            user2Id: friendRequest.toUserId,
          },
        }),
      ]);

      // Debug: log created friendship
      // eslint-disable-next-line no-console
      console.debug("Friendship created:", result[1]);

      return {
        success: true,
        message: "Friend request accepted",
      };
    },

    declineFriendRequest: async (_: any, { requestId }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const friendRequest = await prisma.friendRequest.findUnique({
        where: { id: requestId },
      });

      if (!friendRequest) {
        throw new GraphQLError("Friend request not found", {
          extensions: { code: "REQUEST_NOT_FOUND" },
        });
      }

      if (friendRequest.toUserId !== context.user.userId) {
        throw new GraphQLError("Not authorized to decline this request", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      if (friendRequest.status !== "pending") {
        throw new GraphQLError("Friend request already processed", {
          extensions: { code: "REQUEST_PROCESSED" },
        });
      }

      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "declined" },
      });

      return {
        success: true,
        message: "Friend request declined",
      };
    },

    removeFriend: async (_: any, { friendId }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: context.user.userId, user2Id: friendId },
            { user1Id: friendId, user2Id: context.user.userId },
          ],
        },
      });

      if (!friendship) {
        throw new GraphQLError("Friendship not found", {
          extensions: { code: "FRIENDSHIP_NOT_FOUND" },
        });
      }

      await prisma.friendship.delete({
        where: { id: friendship.id },
      });

      return {
        success: true,
        message: "Friend removed",
      };
    },
  },
};
