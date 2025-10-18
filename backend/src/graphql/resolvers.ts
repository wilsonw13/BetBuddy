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
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.pattern.base": "Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number",
      "string.min": "Password must be at least 8 characters long",
    }),
  displayName: Joi.string().min(2).max(50).required(),
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

      // Return the friend (not the current user)
      return friendships.map((friendship) =>
        friendship.user1Id === context.user?.userId ? friendship.user2 : friendship.user1,
      );
    },

    myFriendRequests: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

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

      return requests;
    },

    sentFriendRequests: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

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

      return requests;
    },
  },

  Mutation: {
    register: async (_: any, { input }: any) => {
      // Debug: log incoming register input (sanitized)
      // eslint-disable-next-line no-console
      console.debug("Register resolver input:", { email: input?.email, displayName: input?.displayName });
      // Validate input
      const { error, value } = registerSchema.validate(input);
      if (error) {
        throw new GraphQLError(error.details[0].message, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const { email, password, displayName } = value;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new GraphQLError("User with this email already exists", {
          extensions: { code: "USER_EXISTS" },
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

    sendFriendRequest: async (_: any, { toUserEmail }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      // Find the user by email
      const toUser = await prisma.user.findUnique({
        where: { email: toUserEmail.toLowerCase() },
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

      // Create friendship and update request status in a transaction
      await prisma.$transaction([
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
