import { gql } from "@apollo/client";

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        email
        displayName
        profilePicture
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
        profilePicture
        emailVerified
        createdAt
        updatedAt
      }
      accessToken
      refreshToken
    }
  }
`;

export const GOOGLE_AUTH = gql`
  mutation GoogleAuth($input: GoogleAuthInput!) {
    googleAuth(input: $input) {
      user {
        id
        email
        displayName
        profilePicture
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

export const LOGOUT_ALL = gql`
  mutation LogoutAll {
    logoutAll {
      success
      message
    }
  }
`;

export const SEND_FRIEND_REQUEST = gql`
  mutation SendFriendRequest($toUserEmail: String!) {
    sendFriendRequest(toUserEmail: $toUserEmail) {
      id
      status
      fromUser {
        id
        email
        displayName
        profilePicture
      }
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
