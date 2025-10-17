import gql from 'graphql-tag';

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
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    googleAuth(input: GoogleAuthInput!): AuthPayload!
    refreshToken(input: RefreshTokenInput!): TokenPayload!
    logout(refreshToken: String!): SuccessResponse!
    logoutAll: SuccessResponse!
  }
`;
