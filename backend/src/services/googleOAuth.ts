import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/config/prisma";
import { GoogleProfile, User } from "@/types";
import { GOOGLE_CLIENT_ID } from "@/config/env";

export class GoogleOAuthService {
  private client: OAuth2Client;

  constructor() {
    const clientId = GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error("GOOGLE_CLIENT_ID environment variable is not set");
    }
    this.client = new OAuth2Client(clientId);
  }

  // Verify Google ID token and extract profile
  async verifyGoogleToken(idToken: string): Promise<GoogleProfile> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error("Invalid token payload");
      }

      return {
        googleId: payload.sub,
        email: payload.email!,
        emailVerified: payload.email_verified || false,
        displayName: payload.name || payload.email!.split("@")[0],
        profilePicture: payload.picture,
      };
    } catch (error) {
      console.error("Google token verification error:", error);
      throw new Error("Invalid Google token");
    }
  }

  // Find or create user with Google profile
  async findOrCreateGoogleUser(googleProfile: GoogleProfile): Promise<User> {
    return await prisma.$transaction(async (tx) => {
      // Check if user exists with this Google ID
      let user = await tx.user.findUnique({
        where: { googleId: googleProfile.googleId },
        select: {
          id: true,
          email: true,
          googleId: true,
          displayName: true,
          profilePicture: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // If user exists with Google ID, update last login and return
      if (user) {
        await tx.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });
        return user;
      }

      // Check if user exists with this email (email/password account)
      user = await tx.user.findUnique({
        where: { email: googleProfile.email.toLowerCase() },
        select: {
          id: true,
          email: true,
          googleId: true,
          displayName: true,
          profilePicture: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // If email exists, link Google account to existing user
      if (user) {
        // If already has a different Google ID, throw error
        if (user.googleId && user.googleId !== googleProfile.googleId) {
          throw new Error("This email is already linked to a different Google account");
        }

        // Link Google account
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            googleId: googleProfile.googleId,
            emailVerified: googleProfile.emailVerified || user.emailVerified,
            profilePicture: user.profilePicture || googleProfile.profilePicture,
            lastLogin: new Date(),
          },
          select: {
            id: true,
            email: true,
            googleId: true,
            displayName: true,
            profilePicture: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return updatedUser;
      }

      // Create new user with Google account
      const newUser = await tx.user.create({
        data: {
          email: googleProfile.email.toLowerCase(),
          googleId: googleProfile.googleId,
          displayName: googleProfile.displayName,
          profilePicture: googleProfile.profilePicture,
          emailVerified: googleProfile.emailVerified,
          lastLogin: new Date(),
        },
        select: {
          id: true,
          email: true,
          googleId: true,
          displayName: true,
          profilePicture: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return newUser;
    });
  }

  // Unlink Google account from user
  async unlinkGoogleAccount(userId: string): Promise<void> {
    // Check if user has password (can't unlink if it's the only auth method)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.passwordHash) {
      throw new Error("Cannot unlink Google account without setting a password first");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { googleId: null },
    });
  }
}

export const googleOAuthService = new GoogleOAuthService();
