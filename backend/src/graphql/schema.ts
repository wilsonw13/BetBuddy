import gql from "graphql-tag";

export const typeDefs = gql`
  scalar DateTime

  type User {
    id: ID!
    email: String!
    displayName: String!
    profilePicture: String
    emailVerified: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    lastLogin: DateTime
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
    profilePicture: String
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
    pointsStaked: Int!
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
    createdAt: DateTime!
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

  input GoogleAuthInput {
    idToken: String!
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
    pointsStaked: Int!
    startDate: DateTime!
    participantDisplayNames: [String!]!
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

  type Query {
    me: User
    health: String!
    myFriends: [Friend!]!
    myFriendRequests: [FriendRequest!]!
    sentFriendRequests: [FriendRequest!]!

    myBets: [Bet!]!
    pendingBets: [Bet!]!
    activeBets: [Bet!]!
    completedBets: [Bet!]!
    bet(id: ID!): Bet

    myBetGroups: [BetGroup!]!
    betGroup(id: ID!): BetGroup
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    googleAuth(input: GoogleAuthInput!): AuthPayload!
    refreshToken(input: RefreshTokenInput!): TokenPayload!
    logout(refreshToken: String!): SuccessResponse!
    logoutAll: SuccessResponse!

    sendFriendRequest(toDisplayName: String!): FriendRequest!
    acceptFriendRequest(requestId: ID!): SuccessResponse!
    declineFriendRequest(requestId: ID!): SuccessResponse!
    removeFriend(friendId: ID!): SuccessResponse!

    createBetGroup(input: CreateBetGroupInput!): BetGroup!
    addGroupMembers(groupId: ID!, displayNames: [String!]!): BetGroup!
    removeGroupMember(groupId: ID!, userId: ID!): SuccessResponse!

    createBet(input: CreateBetInput!): Bet!
    acceptBet(betId: ID!): SuccessResponse!
    declineBet(betId: ID!): SuccessResponse!
    cancelBet(betId: ID!): SuccessResponse!

    submitProof(input: SubmitProofInput!): BetProof!
    verifyProof(proofId: ID!, verified: Boolean!): BetProof!
  }
`;
