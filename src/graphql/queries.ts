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

export const GET_MY_BET_GROUPS = gql`
  query GetMyBetGroups {
    myBetGroups {
      id
      name
      description
      owner {
        id
        email
        displayName
        profilePicture
      }
      members {
        id
        user {
          id
          email
          displayName
          profilePicture
        }
        joinedAt
      }
      bets {
        id
        title
        status
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_BETS = gql`
  query GetMyBets {
    myBets {
      id
      title
      description
      betActivity
      proofType
      frequency
      betLength
      pointsStaked
      startDate
      endDate
      status
      isGroupBet
      creator {
        id
        email
        displayName
        profilePicture
      }
      group {
        id
        name
        description
      }
      participants {
        id
        status
        acceptedAt
        user {
          id
          email
          displayName
          profilePicture
        }
      }
      proofs {
        id
        proofType
        imageUrl
        verified
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_PENDING_BETS = gql`
  query GetPendingBets {
    pendingBets {
      id
      title
      description
      betActivity
      proofType
      frequency
      betLength
      pointsStaked
      startDate
      endDate
      status
      isGroupBet
      creator {
        id
        email
        displayName
        profilePicture
      }
      group {
        id
        name
        description
      }
      participants {
        id
        status
        acceptedAt
        user {
          id
          email
          displayName
          profilePicture
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ACTIVE_BETS = gql`
  query GetActiveBets {
    activeBets {
      id
      title
      description
      betActivity
      proofType
      frequency
      betLength
      pointsStaked
      startDate
      endDate
      status
      isGroupBet
      creator {
        id
        email
        displayName
        profilePicture
      }
      group {
        id
        name
        description
      }
      participants {
        id
        status
        acceptedAt
        user {
          id
          email
          displayName
          profilePicture
        }
      }
      proofs {
        id
        proofType
        imageUrl
        verified
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_NOTIFICATIONS = gql`
  query GetMyNotifications {
    myNotifications {
      id
      type
      title
      message
      isRead
      actionUrl
      metadata
      createdAt
    }
  }
`;

export const GET_UNREAD_NOTIFICATION_COUNT = gql`
  query GetUnreadNotificationCount {
    unreadNotificationCount
  }
`;
