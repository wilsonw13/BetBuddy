import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/prisma";
import { TokenPayload } from "../types";
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from "@/config/env";

export class TokenService {
  private accessSecret: string;
  private refreshSecret: string;
  private accessExpiresIn: string;
  private refreshExpiresIn: string;

  constructor() {
    this.accessSecret = JWT_ACCESS_SECRET || "access_secret";
    this.refreshSecret = JWT_REFRESH_SECRET || "refresh_secret";
    this.accessExpiresIn = JWT_ACCESS_EXPIRES_IN || "15m";
    this.refreshExpiresIn = JWT_REFRESH_EXPIRES_IN || "7d";
  }

  // Generate access token (short-lived)
  generateAccessToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      type: "access",
    };

    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn,
    });
  }

  // Generate refresh token (long-lived)
  async generateRefreshToken(userId: string, email: string): Promise<string> {
    const payload: TokenPayload = {
      userId,
      email,
      type: "refresh",
    };

    const token = jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
    });

    // Hash and store refresh token in database
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return token;
  }

  // Verify access token
  verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.accessSecret) as TokenPayload;

      if (payload.type !== "access") {
        throw new Error("Invalid token type");
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Access token expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid access token");
      }
      throw error;
    }
  }

  // Verify refresh token
  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.refreshSecret) as TokenPayload;

      if (payload.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      // Check if token exists and is not revoked in database
      const tokenHash = this.hashToken(token);
      const refreshToken = await prisma.refreshToken.findFirst({
        where: {
          tokenHash,
          expiresAt: { gt: new Date() },
          revoked: false,
        },
      });

      if (!refreshToken) {
        throw new Error("Refresh token not found or expired");
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Refresh token expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid refresh token");
      }
      throw error;
    }
  }

  // Revoke refresh token (logout)
  async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);

    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  // Revoke all user's refresh tokens (logout all devices)
  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }

  // Refresh token rotation - revoke old token and issue new one
  async rotateRefreshToken(oldToken: string, userId: string, email: string): Promise<string> {
    await this.revokeRefreshToken(oldToken);
    return await this.generateRefreshToken(userId, email);
  }

  // Clean up expired tokens (run periodically)
  async cleanupExpiredTokens(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revoked: true }],
      },
    });
  }

  // Hash token for storage
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}

export const tokenService = new TokenService();
