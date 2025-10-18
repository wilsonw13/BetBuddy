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

  type Query {
    me: User
    health: String!
    myFriends: [Friend!]!
    myFriendRequests: [FriendRequest!]!
    sentFriendRequests: [FriendRequest!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    googleAuth(input: GoogleAuthInput!): AuthPayload!
    refreshToken(input: RefreshTokenInput!): TokenPayload!
    logout(refreshToken: String!): SuccessResponse!
    logoutAll: SuccessResponse!

    sendFriendRequest(toUserEmail: String!): FriendRequest!
    acceptFriendRequest(requestId: ID!): SuccessResponse!
    declineFriendRequest(requestId: ID!): SuccessResponse!
    removeFriend(friendId: ID!): SuccessResponse!
  }
`;
