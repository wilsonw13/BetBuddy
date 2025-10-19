import { GraphQLError } from "graphql";
import { prisma } from "@/config/prisma";
import { Context } from "@types";

export const leaderboardResolvers = {
  Query: {
    globalLeaderboard: async (_: any, __: any, context: Context) => {
      // No auth required for global leaderboard
      const entries = await prisma.leaderboard_global.findMany();
      return entries.map((entry: any) => ({
        userId: entry.user_id,
        displayName: entry.displayName,
        profileImage: entry.profileImage || "", // always non-null
        leaderboardRank: entry.leaderboardRank,
        score: entry.score,
        successRate: entry.successRate,
        successfulBets: entry.successfulBets,
        totalBets: entry.totalBets,
      }));
    },

    friendLeaderboard: async (_: any, { ownerId }: any, context: Context) => {
      // Optionally require auth for privacy
      const entries = await prisma.leaderboard_friends.findMany({
        where: { owner_id: ownerId },
      });
      return entries.map((entry: any) => ({
        ownerId: entry.owner_id,
        friendId: entry.friend_id,
        displayName: entry.displayName,
        profileImage: entry.profileImage,
        leaderboardRank: entry.leaderboardRank,
        score: entry.score,
        successRate: entry.successRate,
        successfulBets: entry.successfulBets,
        totalBets: entry.totalBets,
      }));
    },

    groupLeaderboard: async (_: any, { groupId }: any, context: Context) => {
      // Optionally require auth for privacy
      const entries = await prisma.leaderboard_group.findMany({
        where: { group_id: groupId },
      });
      return entries.map((entry: any) => ({
        memberId: entry.member_id,
        displayName: entry.displayName,
        profileImage: entry.profileImage,
        groupId: entry.group_id,
        leaderboardRank: entry.leaderboardRank,
        score: entry.score,
        successRate: entry.successRate,
        successfulBets: entry.successfulBets,
        totalBets: entry.totalBets,
      }));
    },
  },
};
