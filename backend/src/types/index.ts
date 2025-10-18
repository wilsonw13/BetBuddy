import { Request } from "express";

// User Types (matching Prisma schema)
export interface User {
  id: string;
  email: string;
  passwordHash?: string | null;
  googleId?: string | null;
  displayName: string;
  profilePicture?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date | null;
}

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
}

// Auth Request Types
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Auth Response Types
export interface AuthResponse {
  user: Omit<User, "passwordHash">;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
}

// Express Request with User
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// Google Profile
export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  profilePicture?: string;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Context {
  user?: {
    userId: string;
    email: string;
  };
}
