export type ProofType = 'live_photo' | 'location';

export type BetFrequency = '1x/week' | '2x/week' | '3x/week' | '4x/week' | '1x/month' | '2x/month' | 'daily';

export type BetStatus = 'active' | 'completed' | 'failed' | 'pending_verification';

export type UserRank = 'beginner' | 'intermediate' | 'advanced' | 'legendary';

export interface User {
  id: string;
  name: string;
  profilePicture?: string;
  bannerImage?: string;
  successRate: number;
  totalBets: number;
  successfulBets: number;
  points: number;
  rank: UserRank;
  friendGroups: string[];
  pranksActive: Prank[];
}

export interface Bet {
  id: string;
  userId1: string;
  userId2: string;
  betActivity: string;
  proofType: ProofType;
  frequency: BetFrequency;
  betLength: number; // in days
  startDate: Date;
  endDate: Date;
  status: BetStatus;
  pointsStaked: number;
  proofs: Proof[];
  createdAt: Date;
}

export interface Proof {
  id: string;
  betId: string;
  userId: string;
  timestamp: Date;
  proofType: ProofType;
  imageUri?: string;
  locationData?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  verified: boolean;
  verifiedBy?: string;
  aiSuggestionSuspicious?: boolean;
  aiSuggestionReason?: string;
}

export interface LeaderboardEntry {
  user: User;
  score: number; // weighted average of success rate and total successful bets
  rank: number;
}

export interface FriendGroup {
  id: string;
  name: string;
  members: string[]; // user IDs
  createdAt: Date;
}

export interface Prank {
  id: string;
  type: 'banner_draw' | 'chinese_language' | 'icon_change' | 'loading_screen' | 'custom';
  appliedBy: string;
  expiresAt: Date;
  data?: any; // custom data for the prank
}

export interface RedeemableItem {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'prank' | 'cosmetic' | 'feature';
  duration?: number; // in hours, for time-limited items
}
