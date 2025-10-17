import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  fromPromise,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import * as SecureStore from "expo-secure-store";
import { REFRESH_TOKEN } from "../graphql/mutations";

// Replace with your local IP address or deployed backend URL
const GRAPHQL_ENDPOINT = "http://192.168.1.100:3000/graphql";

let accessToken: string | null = null;

// Get access token from memory
export const getAccessToken = () => accessToken;

// Set access token in memory
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

// Get refresh token from secure storage
const getRefreshToken = async () => {
  return await SecureStore.getItemAsync("refreshToken");
};

// Refresh token function
const refreshAccessToken = async () => {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          mutation RefreshToken($input: RefreshTokenInput!) {
            refreshToken(input: $input) {
              accessToken
              refreshToken
            }
          }
        `,
        variables: {
          input: {
            refreshToken,
          },
        },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      result.data.refreshToken;

    // Update tokens
    setAccessToken(newAccessToken);
    await SecureStore.setItemAsync("refreshToken", newRefreshToken);

    return newAccessToken;
  } catch (error) {
    // Clear tokens on refresh failure
    setAccessToken(null);
    await SecureStore.deleteItemAsync("refreshToken");
    throw error;
  }
};

// HTTP Link
const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
});

// Auth Link - adds access token to headers
const authLink = setContext(async (_, { headers }) => {
  const token = getAccessToken();

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Error Link - handles token expiration
const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        // Check if error is due to expired token
        if (
          err.extensions?.code === "UNAUTHENTICATED" ||
          err.message.includes("expired")
        ) {
          // Try to refresh token
          return fromPromise(
            refreshAccessToken().catch((error) => {
              // Token refresh failed, user needs to login again
              setAccessToken(null);
              SecureStore.deleteItemAsync("refreshToken");
              // You can dispatch a logout action here if using Redux
              return;
            }),
          )
            .filter((value) => Boolean(value))
            .flatMap((newAccessToken) => {
              // Retry the request with new token
              const oldHeaders = operation.getContext().headers;
              operation.setContext({
                headers: {
                  ...oldHeaders,
                  authorization: `Bearer ${newAccessToken}`,
                },
              });

              return forward(operation);
            });
        }
      }
    }

    if (networkError) {
      console.log(`[Network error]: ${networkError}`);
    }
  },
);

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});
