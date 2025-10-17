import { gql } from '@apollo/client';

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      displayName
      profilePicture
      emailVerified
      createdAt
      updatedAt
      lastLogin
    }
  }
`;

export const HEALTH_CHECK = gql`
  query HealthCheck {
    health
  }
`;
