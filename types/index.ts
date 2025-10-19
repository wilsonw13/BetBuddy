export type ProofType = "live_photo" | "location";
export type BetFrequency = "1x/week" | "2x/week" | "3x/week" | "4x/week" | "1x/month" | "2x/month" | "1x/day";
export type BetStatus = "active" | "completed" | "failed" | "pending_verification" | "pending";
export type UserRank = "beginner" | "intermediate" | "advanced" | "legendary";

export interface User {
  id: string;
  email?: string;
  passwordHash?: string;
  displayName?: string;
  name?: string;
  profileImage?: string;
  bannerImage?: string;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  successRate?: number;
  totalBets?: number;
  successfulBets?: number;
  points?: number;
  rank?: UserRank;
  friendGroups?: string[];
  pranksActive?: Prank[];
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

export interface Bet {
  id: string;
  userId1?: string;
  userId2?: string;
  betActivity: string;
  proofType: ProofType;
  frequency: BetFrequency;
  betLength: number;
  startDate: Date;
  endDate: Date;
  status: BetStatus;
  moneyStaked?: number;
  pointsStaked?: number;
  proofs?: Proof[];
  createdAt?: Date;
  groupId?: string;
  isGroupBet?: boolean;
}

export interface Proof {
  id: string;
  betId: string;
  userId: string;
  timestamp?: Date;
  proofType: ProofType;
  imageUri?: string;
  imageUrl?: string;
  locationData?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  latitude?: number;
  longitude?: number;
  address?: string;
  verified: boolean;
  verifiedBy?: string;
  aiSuggestionSuspicious?: boolean;
  aiSuggestionReason?: string;
  aiSuggestionConfidence?: number;
  createdAt?: Date;
}

export interface LeaderboardEntry {
  user: User;
  score: number;
  rank: number;
}

export interface FriendGroup {
  id: string;
  name: string;
  members: string[];
  createdAt: Date;
}

export interface Prank {
  id: string;
  type: "banner_draw" | "chinese_language" | "icon_change" | "loading_screen" | "custom";
  appliedBy: string;
  expiresAt: Date;
  data?: any;
}

export interface RedeemableItem {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: "prank" | "cosmetic" | "feature";
  duration?: number;
}
