import React, { createContext, useState, useContext, useEffect } from "react";
import { useMutation } from "@apollo/client";
import * as SecureStore from "expo-secure-store";
import { setAccessToken } from "@/config/apolloClient";
import { REGISTER, LOGIN, LOGOUT } from "@/graphql/mutations";

interface User {
  id: string;
  email: string;
  displayName: string;
  profileImage: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  // loginWithGoogle removed
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure Google Sign-In
// GoogleSignin.configure({
//   webClientId: "YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com", // From Google Cloud Console
//   offlineAccess: true,
//   forceCodeForRefreshToken: true,
// });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GraphQL Mutations
  const [registerMutation] = useMutation(REGISTER);
  const [loginMutation] = useMutation(LOGIN);
  const [logoutMutation] = useMutation(LOGOUT);

  // Auto-login on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const refreshToken = await SecureStore.getItemAsync("refreshToken");

      if (refreshToken) {
        // Try to get user info with current tokens
        // If access token is expired, apolloClient will auto-refresh
        // For simplicity, we'll just mark as authenticated
        // You can fetch user with GET_ME query here
      } else {
        setUser(null);
        setAccessToken(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const trimmedEmail = email.trim();

      // Basic client-side email validation to avoid sending malformed values
      if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
        const message = "Please enter a valid email address";
        setError(message);
        throw new Error(message);
      }

      // Basic display name validation
      if (!/^[a-zA-Z0-9]{3,20}$/.test(displayName)) {
        const message = "Display name must be 3-20 characters and contain only letters and numbers";
        setError(message);
        throw new Error(message);
      }

      // Debug: log what we're about to send (don't log passwords)
      // eslint-disable-next-line no-console
      console.debug("Register variables:", { email: trimmedEmail, displayName });

      const { data } = await registerMutation({
        variables: {
          input: {
            email: trimmedEmail,
            password,
            displayName,
          },
        },
      });

      if (data?.register) {
        const { user, accessToken, refreshToken } = data.register;

        // Store tokens
        setAccessToken(accessToken);
        await SecureStore.setItemAsync("refreshToken", refreshToken);

        setUser(user);
      }
    } catch (error: any) {
      const message = error.graphQLErrors?.[0]?.message || error.message || "Registration failed";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    const trimmedEmail = email.trim();

    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      const message = "Please enter a valid email address";
      setError(message);
      throw new Error(message);
    }

    console.debug("Login variables:", { email: trimmedEmail });

    const { data } = await loginMutation({
      variables: {
        input: {
          email: trimmedEmail,
          password,
        },
      },
    });

    if (data?.login) {
      const { user, accessToken, refreshToken } = data.login;

      // Store tokens
      setAccessToken(accessToken);
      await SecureStore.setItemAsync("refreshToken", refreshToken);

      setUser(user);
      setIsLoading(false);
      return;
    }
    // If login failed (no data.login), reject promise
    setIsLoading(false);
    const message = "Login failed";
    setError(message);
    throw new Error(message);
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const refreshToken = await SecureStore.getItemAsync("refreshToken");

      if (refreshToken) {
        try {
          await logoutMutation({
            variables: {
              refreshToken,
            },
          });
        } catch (err) {
          console.error("Logout mutation error:", err);
        }
      }

      // Clear tokens
      setAccessToken(null);
      await SecureStore.deleteItemAsync("refreshToken");

      setUser(null);
    } catch (error: any) {
      console.error("Logout error:", error);
      setError(error.message || "Logout failed");
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
