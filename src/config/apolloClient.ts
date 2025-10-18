import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, fromPromise } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import * as SecureStore from "expo-secure-store";
import { REFRESH_TOKEN } from "../graphql/mutations";

// For iOS Simulator, use localhost (default) since it shares the same network as the host
// For Android Emulator, use 10.0.2.2 (.env.local)
const GRAPHQL_ENDPOINT = process.env.EXPO_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:6767/graphql";

// hi

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

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = result.data.refreshToken;

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
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // Check if error is due to expired token
      if (err.extensions?.code === "UNAUTHENTICATED" || err.message.includes("expired")) {
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
});

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

// Health check on app load
export const pingBackendHealth = async () => {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "query { health }" }),
    });
    const result = await response.json();
    if (result.data && result.data.health === "OK") {
      return { status: "ok", result };
    } else {
      return { status: "unexpected", result };
    }
  } catch (err) {
    return { status: "error", error: err };
  }
};
