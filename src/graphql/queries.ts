import { gql } from "@apollo/client";

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      displayName
      profileImage
      emailVerified
      createdAt
      updatedAt
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
      profileImage
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
        profileImage
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
        profileImage
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
        profileImage
      }
      members {
        id
        user {
          id
          email
          displayName
          profileImage
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
        profileImage
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
          profileImage
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
        profileImage
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
          profileImage
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
        profileImage
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
          profileImage
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

export const GET_GLOBAL_LEADERBOARD = gql`
  query GetGlobalLeaderboard {
    globalLeaderboard {
      userId
      displayName
      profileImage
      leaderboardRank
      score
      successRate
      successfulBets
      totalBets
    }
  }
`;

export const GET_FRIEND_LEADERBOARD = gql`
  query GetFriendLeaderboard($ownerId: ID!) {
    friendLeaderboard(ownerId: $ownerId) {
      ownerId
      friendId
      displayName
      profileImage
      leaderboardRank
      score
      successRate
      successfulBets
      totalBets
    }
  }
`;

export const GET_GROUP_LEADERBOARD = gql`
  query GetGroupLeaderboard($groupId: ID!) {
    groupLeaderboard(groupId: $groupId) {
      memberId
      displayName
      profileImage
      groupId
      leaderboardRank
      score
      successRate
      successfulBets
      totalBets
    }
  }
`;
