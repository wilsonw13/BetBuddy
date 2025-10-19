import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import merge from "lodash.merge";

import { authResolvers } from "@/graphql/resolvers/auth.resolvers";
import { friendResolvers } from "@/graphql/resolvers/friend.resolvers";
import { groupResolvers } from "@/graphql/resolvers/group.resolvers";
import { notificationResolvers } from "@/graphql/resolvers/notification.resolvers";
import { betResolvers } from "@/graphql/resolvers/bet.resolvers";
import { betParticipantResolvers } from "@/graphql/resolvers/betParticipant.resolvers";
import { betProofResolvers } from "@/graphql/resolvers/betProof.resolvers";
import { betProofReviewResolvers } from "@/graphql/resolvers/betProofReview.resolvers";
import { leaderboardResolvers } from "@/graphql/resolvers/leaderboard.resolvers";
import { userResolvers } from "@/graphql/resolvers/user.resolvers";
import { geminiResolvers } from "@/graphql/resolvers/gemini.resolvers";

const baseResolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,

  Query: {
    health: () => "OK",
  },
};

export const resolvers = merge(
  baseResolvers,
  authResolvers,
  friendResolvers,
  groupResolvers,
  notificationResolvers,
  betResolvers,
  betParticipantResolvers,
  betProofResolvers,
  betProofReviewResolvers,
  leaderboardResolvers,
  userResolvers,
  geminiResolvers,
);
