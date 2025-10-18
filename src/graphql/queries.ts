import { gql } from "@apollo/client";

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

export const GET_MY_FRIENDS = gql`
  query GetMyFriends {
    myFriends {
      id
      email
      displayName
      profilePicture
      # Optional leaderboard stats (backend may provide these fields)
      successRate
      totalBets
      successfulBets
      points
      rank
      createdAt
    }
  }
`;

export const GET_MY_FRIEND_REQUESTS = gql`
  query GetMyFriendRequests {
    myFriendRequests {
      id
      status
      fromUser {
        id
        email
        displayName
        profilePicture
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_SENT_FRIEND_REQUESTS = gql`
  query GetSentFriendRequests {
    sentFriendRequests {
      id
      status
      toUser {
        id
        email
        displayName
        profilePicture
      }
      createdAt
      updatedAt
    }
  }
`;
