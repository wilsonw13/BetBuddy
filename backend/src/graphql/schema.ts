import gql from "graphql-tag";

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type User {
    id: ID!
    email: String!
    displayName: String!
    profileImage: String
    bannerImage: String
    emailVerified: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthPayload {
    user: User!
    accessToken: String!
    refreshToken: String!
  }

  type TokenPayload {
    accessToken: String!
    refreshToken: String!
  }

  type SuccessResponse {
    success: Boolean!
    message: String
  }

  type FriendRequest {
    id: ID!
    fromUser: User!
    toUser: User!
    status: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Friend {
    id: ID!
    email: String!
    displayName: String!
    profileImage: String
    bannerImage: String
    createdAt: DateTime!
  }

  type BetGroupMember {
    id: ID!
    user: User!
    joinedAt: DateTime!
  }

  type BetGroup {
    id: ID!
    name: String!
    description: String
    owner: User!
    bannerImage: String
    members: [BetGroupMember!]!
    bets: [Bet!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Bet {
    id: ID!
    title: String!
    description: String
    betActivity: String!
    proofType: String!
    frequency: String!
    betLength: Int!
    moneyStaked: Float!
    pointsReward: Int!
    startDate: DateTime!
    endDate: DateTime!
    status: String!
    creator: User!
    group: BetGroup
    isGroupBet: Boolean!
    participants: [BetParticipant!]!
    proofs: [BetProof!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type BetParticipant {
    id: ID!
    bet: Bet!
    user: User!
    status: String!
    acceptedAt: DateTime
    createdAt: DateTime!
  }

  type BetProof {
    id: ID!
    bet: Bet!
    user: User!
    proofType: String!
    imageUrl: String
    latitude: Float
    longitude: Float
    address: String
    verified: Boolean!
    verifiedBy: String
    aiSuggestionSuspicious: Boolean
    aiSuggestionReason: String
    aiSuggestionConfidence: Float
    reviews: [BetProofReview!]!
    createdAt: DateTime!
  }

  type BetProofReview {
    id: ID!
    betProof: BetProof!
    reviewer: User!
    isSuspicious: Boolean!
    reason: String
    confidence: Float
    createdAt: DateTime!
  }

  type Notification {
    id: ID!
    user: User!
    type: String!
    title: String!
    message: String!
    isRead: Boolean!
    actionUrl: String
    metadata: JSON
    createdAt: DateTime!
  }

  type LeaderboardEntry {
    userId: ID!
    displayName: String!
    profileImage: String!
    leaderboardRank: Int!
    score: Int!
    successRate: Float!
    successfulBets: Int!
    totalBets: Int!
  }

  type FriendLeaderboardEntry {
    ownerId: ID!
    friendId: ID!
    displayName: String!
    profileImage: String!
    leaderboardRank: Int!
    score: Int!
    successRate: Float!
    successfulBets: Int!
    totalBets: Int!
  }

  type GroupLeaderboardEntry {
    memberId: ID!
    displayName: String!
    profileImage: String!
    groupId: ID!
    leaderboardRank: Int!
    score: Int!
    successRate: Float!
    successfulBets: Int!
    totalBets: Int!
  }

  input RegisterInput {
    email: String!
    password: String!
    displayName: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RefreshTokenInput {
    refreshToken: String!
  }

  input CreateBetGroupInput {
    name: String!
    description: String
    memberDisplayNames: [String!]!
  }

  input CreateBetInput {
    title: String!
    description: String
    betActivity: String!
    proofType: String!
    frequency: String!
    betLength: Int!
    moneyStaked: Float!
    pointsReward: Int!
    startDate: DateTime!
    participantDisplayNames: [String!]
    groupId: ID
  }

  input SubmitProofInput {
    betId: ID!
    proofType: String!
    imageUrl: String
    latitude: Float
    longitude: Float
    address: String
    aiSuggestionSuspicious: Boolean
    aiSuggestionReason: String
    aiSuggestionConfidence: Float
  }

  input SubmitBetProofReviewInput {
    betProofId: ID!
    isSuspicious: Boolean!
    reason: String
    confidence: Float
  }

  type UpdateProfileImageResponse {
    success: Boolean!
    imageUrl: String
  }

  type Query {
    me: User
    health: String!
    myFriends: [Friend!]!
    myFriendRequests: [FriendRequest!]!
    sentFriendRequests: [FriendRequest!]!
    geminiSuggestBets(userInterests: [String!]!, pastBets: [String!]!): [String!]!

    myBets: [Bet!]!
    pendingBets: [Bet!]!
    activeBets: [Bet!]!
    completedBets: [Bet!]!
    bet(id: ID!): Bet

    myNotifications: [Notification!]!
    unreadNotificationCount: Int!

    myBetGroups: [BetGroup!]!
    betGroup(id: ID!): BetGroup

    globalLeaderboard: [LeaderboardEntry!]!
    friendLeaderboard(ownerId: ID!): [FriendLeaderboardEntry!]!
    groupLeaderboard(groupId: ID!): [GroupLeaderboardEntry!]!

    betProofReviews(betProofId: ID!): [BetProofReview!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refreshToken(input: RefreshTokenInput!): TokenPayload!
    logout(refreshToken: String!): SuccessResponse!
    logoutAll: SuccessResponse!

    sendFriendRequest(toDisplayName: String!): FriendRequest!
    acceptFriendRequest(requestId: ID!): SuccessResponse!
    declineFriendRequest(requestId: ID!): SuccessResponse!
    removeFriend(friendId: ID!): SuccessResponse!

    createBetGroup(input: CreateBetGroupInput!): BetGroup!
    updateBetGroup(groupId: ID!, name: String, description: String): BetGroup!
    addGroupMembers(groupId: ID!, displayNames: [String!]!): BetGroup!
    removeGroupMember(groupId: ID!, userId: ID!): SuccessResponse!
    leaveGroup(groupId: ID!): SuccessResponse!
    deleteGroup(groupId: ID!): SuccessResponse!

    createBet(input: CreateBetInput!): Bet!
    acceptBet(betId: ID!): SuccessResponse!
    declineBet(betId: ID!): SuccessResponse!
    cancelBet(betId: ID!): SuccessResponse!

    submitProof(input: SubmitProofInput!): BetProof!
    verifyProof(proofId: ID!, verified: Boolean!): BetProof!

    submitBetProofReview(input: SubmitBetProofReviewInput!): BetProofReview!

    markNotificationAsRead(notificationId: ID!): SuccessResponse!
    markAllNotificationsAsRead: SuccessResponse!
    deleteNotification(notificationId: ID!): SuccessResponse!

    updateProfileImage(image: String!): UpdateProfileImageResponse!
    updateBannerImage(image: String!): UpdateProfileImageResponse!
    geminiVerifyBetPhoto(imageUrl: String!, betContext: String!): JSON
  }
`;
