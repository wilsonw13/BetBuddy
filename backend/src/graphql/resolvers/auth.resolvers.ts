import { GraphQLError } from "graphql";
import bcrypt from "bcrypt";
import Joi from "joi";
import { prisma } from "@/config/prisma";
import { getRandomProfilePicture, getRandomBanner } from "@/config/defaultImage";
import { tokenService } from "@/services/token.service";
import { Context } from "@types";
import { BCRYPT_ROUNDS } from "@/config/env";

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

export const authResolvers = {
  Query: {
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
          profileImage: true,
          bannerImage: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new GraphQLError("User not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return user;
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
          profileImage: getRandomProfilePicture() || "",
          bannerImage: getRandomBanner() || "",
        },
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

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        throw new GraphQLError("Invalid email or password", {
          extensions: { code: "INVALID_CREDENTIALS" },
        });
      }

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
  },
};
