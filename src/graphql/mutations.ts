export const SUBMIT_PROOF = gql`
  mutation SubmitProof($input: SubmitProofInput!) {
    submitProof(input: $input) {
      id
      bet {
        id
      }
      user {
        id
        displayName
        profileImage
      }
      proofType
      imageUrl
      latitude
      longitude
      address
      aiSuggestionSuspicious
      aiSuggestionReason
      aiSuggestionConfidence
      verified
      createdAt
    }
  }
`;
import { gql } from "@apollo/client";

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        email
        displayName
        profileImage
        emailVerified
        createdAt
        updatedAt
      }
      accessToken
      refreshToken
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        displayName
        profileImage
        emailVerified
        createdAt
        updatedAt
      }
      accessToken
      refreshToken
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
      accessToken
      refreshToken
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken) {
      success
      message
    }
  }
`;

export const SEND_FRIEND_REQUEST = gql`
  mutation SendFriendRequest($toDisplayName: String!) {
    sendFriendRequest(toDisplayName: $toDisplayName) {
      id
      status
      fromUser {
        id
        email
        displayName
        profileImage
      }
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

export const ACCEPT_FRIEND_REQUEST = gql`
  mutation AcceptFriendRequest($requestId: ID!) {
    acceptFriendRequest(requestId: $requestId) {
      success
      message
    }
  }
`;

export const DECLINE_FRIEND_REQUEST = gql`
  mutation DeclineFriendRequest($requestId: ID!) {
    declineFriendRequest(requestId: $requestId) {
      success
      message
    }
  }
`;

export const REMOVE_FRIEND = gql`
  mutation RemoveFriend($friendId: ID!) {
    removeFriend(friendId: $friendId) {
      success
      message
    }
  }
`;

export const CREATE_BET_GROUP = gql`
  mutation CreateBetGroup($input: CreateBetGroupInput!) {
    createBetGroup(input: $input) {
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

export const ADD_GROUP_MEMBERS = gql`
  mutation AddGroupMembers($groupId: ID!, $displayNames: [String!]!) {
    addGroupMembers(groupId: $groupId, displayNames: $displayNames) {
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

export const REMOVE_GROUP_MEMBER = gql`
  mutation RemoveGroupMember($groupId: ID!, $userId: ID!) {
    removeGroupMember(groupId: $groupId, userId: $userId) {
      success
      message
    }
  }
`;

export const UPDATE_BET_GROUP = gql`
  mutation UpdateBetGroup($groupId: ID!, $name: String, $description: String) {
    updateBetGroup(groupId: $groupId, name: $name, description: $description) {
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

export const LEAVE_GROUP = gql`
  mutation LeaveGroup($groupId: ID!) {
    leaveGroup(groupId: $groupId) {
      success
      message
    }
  }
`;

export const DELETE_GROUP = gql`
  mutation DeleteGroup($groupId: ID!) {
    deleteGroup(groupId: $groupId) {
      success
      message
    }
  }
`;

export const CREATE_BET = gql`
  mutation CreateBet($input: CreateBetInput!) {
    createBet(input: $input) {
      id
      title
      description
      betActivity
      proofType
      frequency
      betLength
      moneyStaked
      pointsReward
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

export const ACCEPT_BET = gql`
  mutation AcceptBet($betId: ID!) {
    acceptBet(betId: $betId) {
      success
      message
    }
  }
`;

export const DECLINE_BET = gql`
  mutation DeclineBet($betId: ID!) {
    declineBet(betId: $betId) {
      success
      message
    }
  }
`;

export const CANCEL_BET = gql`
  mutation CancelBet($betId: ID!) {
    cancelBet(betId: $betId) {
      success
      message
    }
  }
`;

export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($notificationId: ID!) {
    markNotificationAsRead(notificationId: $notificationId) {
      success
      message
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead {
      success
      message
    }
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($notificationId: ID!) {
    deleteNotification(notificationId: $notificationId) {
      success
      message
    }
  }
`;
