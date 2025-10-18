import { GraphQLError } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import bcrypt from "bcrypt";
import Joi from "joi";
import { prisma } from "@/config/prisma";
import { tokenService } from "@/services/tokenService";
import { googleOAuthService } from "@/services/googleOAuth";

const BCRYPT_ROUNDS = 12;

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  displayName: Joi.string().alphanum().min(3).max(20).required().messages({
    "string.alphanum": "Display name must only contain letters and numbers",
    "string.min": "Display name must be at least 3 characters long",
    "string.max": "Display name must be at most 20 characters long",
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.pattern.base": "Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number",
      "string.min": "Password must be at least 8 characters long",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

interface Context {
  user?: {
    userId: string;
    email: string;
  };
}

export const resolvers = {
  DateTime: DateTimeResolver,

  Query: {
    health: () => "OK",

    me: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: context.user.userId },
        select: {
          id: true,
          email: true,
          displayName: true,
          profilePicture: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
        },
      });

      if (!user) {
        throw new GraphQLError("User not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return user;
    },

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
              profilePicture: true,
              createdAt: true,
            },
          },
          user2: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profilePicture: true,
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
              profilePicture: true,
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
              profilePicture: true,
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
              profilePicture: true,
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
              profilePicture: true,
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
              profilePicture: true,
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
                  profilePicture: true,
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
                  profilePicture: true,
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
              profilePicture: true,
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
                  profilePicture: true,
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
                  profilePicture: true,
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
              profilePicture: true,
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
                  profilePicture: true,
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
                  profilePicture: true,
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
              profilePicture: true,
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
                  profilePicture: true,
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
                  profilePicture: true,
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
              profilePicture: true,
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
                  profilePicture: true,
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
                  profilePicture: true,
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
              profilePicture: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profilePicture: true,
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
              profilePicture: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profilePicture: true,
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
    register: async (_: any, { input }: any) => {
      // Debug: log incoming register input (sanitized)
      // eslint-disable-next-line no-console
      console.debug("Register resolver input:", {
        email: input?.email,
        displayName: input?.displayName,
      });
      // Validate input
      const { error, value } = registerSchema.validate(input);
      if (error) {
        throw new GraphQLError(error.details[0].message, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const { email, password, displayName } = value;

      // Check if email exists
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingEmail) {
        throw new GraphQLError("User with this email already exists", {
          extensions: { code: "USER_EXISTS" },
        });
      }

      // Check if displayName exists
      const existingDisplayName = await prisma.user.findUnique({
        where: { displayName: displayName },
      });

      if (existingDisplayName) {
        throw new GraphQLError("Display name already taken", {
          extensions: { code: "DISPLAYNAME_EXISTS" },
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          displayName,
          emailVerified: false,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          profilePicture: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Generate tokens
      const accessToken = tokenService.generateAccessToken(user.id, user.email);
      const refreshToken = await tokenService.generateRefreshToken(user.id, user.email);

      return {
        user,
        accessToken,
        refreshToken,
      };
    },

    login: async (_: any, { input }: any) => {
      // Debug: log incoming login input (sanitized)
      // eslint-disable-next-line no-console
      console.debug("Login resolver input:", { email: input?.email });
      // Validate input
      const { error, value } = loginSchema.validate(input);
      if (error) {
        throw new GraphQLError(error.details[0].message, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const { email, password } = value;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new GraphQLError("Invalid email or password", {
          extensions: { code: "INVALID_CREDENTIALS" },
        });
      }

      // Check if user has password
      if (!user.passwordHash) {
        throw new GraphQLError("This account uses Google Sign-In. Please login with Google.", {
          extensions: { code: "OAUTH_ONLY_ACCOUNT" },
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        throw new GraphQLError("Invalid email or password", {
          extensions: { code: "INVALID_CREDENTIALS" },
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Generate tokens
      const accessToken = tokenService.generateAccessToken(user.id, user.email);
      const refreshToken = await tokenService.generateRefreshToken(user.id, user.email);

      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      };
    },

    googleAuth: async (_: any, { input }: any) => {
      const { idToken } = input;

      if (!idToken) {
        throw new GraphQLError("Google ID token is required", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      try {
        // Verify Google token and get profile
        const googleProfile = await googleOAuthService.verifyGoogleToken(idToken);

        // Find or create user
        const user = await googleOAuthService.findOrCreateGoogleUser(googleProfile);

        // Generate tokens
        const accessToken = tokenService.generateAccessToken(user.id, user.email);
        const refreshToken = await tokenService.generateRefreshToken(user.id, user.email);

        return {
          user,
          accessToken,
          refreshToken,
        };
      } catch (error: any) {
        throw new GraphQLError(error.message || "Google authentication failed", {
          extensions: { code: "GOOGLE_AUTH_FAILED" },
        });
      }
    },

    refreshToken: async (_: any, { input }: any) => {
      const { refreshToken } = input;

      if (!refreshToken) {
        throw new GraphQLError("Refresh token is required", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      try {
        // Verify refresh token
        const payload = await tokenService.verifyRefreshToken(refreshToken);

        // Generate new tokens with rotation
        const newAccessToken = tokenService.generateAccessToken(payload.userId, payload.email);
        const newRefreshToken = await tokenService.rotateRefreshToken(refreshToken, payload.userId, payload.email);

        return {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        };
      } catch (error: any) {
        throw new GraphQLError(error.message || "Invalid or expired refresh token", {
          extensions: { code: "INVALID_TOKEN" },
        });
      }
    },

    logout: async (_: any, { refreshToken }: any) => {
      if (!refreshToken) {
        throw new GraphQLError("Refresh token is required", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      try {
        await tokenService.revokeRefreshToken(refreshToken);
        return {
          success: true,
          message: "Logged out successfully",
        };
      } catch (error: any) {
        throw new GraphQLError("Logout failed", {
          extensions: { code: "LOGOUT_FAILED" },
        });
      }
    },

    logoutAll: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      try {
        await tokenService.revokeAllUserTokens(context.user.userId);
        return {
          success: true,
          message: "Logged out from all devices successfully",
        };
      } catch (error: any) {
        throw new GraphQLError("Logout failed", {
          extensions: { code: "LOGOUT_FAILED" },
        });
      }
    },

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
              profilePicture: true,
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
              profilePicture: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
            },
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

    createBetGroup: async (_: any, { input }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const { name, description, memberDisplayNames } = input;

      // Find all users by displayName
      const users = await prisma.user.findMany({
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

      // Create group with members
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
              profilePicture: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profilePicture: true,
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
      await prisma.groupMember.createMany({
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
              profilePicture: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  profilePicture: true,
                },
              },
            },
          },
          bets: true,
        },
      });

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

      await prisma.groupMember.deleteMany({
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

      // Calculate end date
      const start = new Date(startDate);
      const end = new Date(start.getTime() + betLength * 24 * 60 * 60 * 1000);

      // Find all participants by displayName
      const participants = await prisma.user.findMany({
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

      // Create bet with participants
      const bet = await prisma.bet.create({
        data: {
          title,
          description,
          betActivity,
          proofType,
          frequency,
          betLength,
          pointsStaked,
          startDate: start,
          endDate: end,
          status: "pending",
          creatorId: context.user.userId,
          groupId,
          isGroupBet: !!groupId,
          participants: {
            create: participants.map((participant) => ({
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
              profilePicture: true,
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
                  profilePicture: true,
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
                  profilePicture: true,
                },
              },
            },
          },
        },
      });

      return bet;
    },

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

      // If all accepted, update bet status to active
      if (allAccepted) {
        await prisma.bet.update({
          where: { id: betId },
          data: { status: "active" },
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

      return {
        success: true,
        message: "Bet declined",
      };
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

      return {
        success: true,
        message: "Bet cancelled",
      };
    },

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
          imageUrl,
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
              profilePicture: true,
            },
          },
        },
      });

      return proof;
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
              profilePicture: true,
            },
          },
        },
      });

      return updatedProof;
    },
  },
};
