import React, { createContext, useState, useContext, useEffect } from "react";
import { useMutation } from "@apollo/client";
import * as SecureStore from "expo-secure-store";
// import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { setAccessToken } from "../config/apolloClient";
import { REGISTER, LOGIN, GOOGLE_AUTH, LOGOUT, LOGOUT_ALL } from "../graphql/mutations";
import { GET_ME } from "../graphql/queries";

interface User {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
  const [googleAuthMutation] = useMutation(GOOGLE_AUTH);
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

      const { data } = await registerMutation({
        variables: {
          input: {
            email,
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
    try {
      setIsLoading(true);
      setError(null);

      const { data } = await loginMutation({
        variables: {
          input: {
            email,
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
      }
    } catch (error: any) {
      const message = error.graphQLErrors?.[0]?.message || error.message || "Login failed";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    // Google Sign-In temporarily disabled - requires custom dev client
    throw new Error("Google Sign-In is temporarily disabled. Please use email/password authentication.");

    /* COMMENTED OUT - Enable when building custom dev client
    try {
      setIsLoading(true);
      setError(null);

      // Check if Play Services are available (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const googleUser = await GoogleSignin.signIn();

      // Get the ID token
      const idToken = googleUser.idToken;

      if (!idToken) {
        throw new Error("Failed to get Google ID token");
      }

      // Authenticate with backend
      const { data } = await googleAuthMutation({
        variables: {
          input: {
            idToken,
          },
        },
      });

      if (data?.googleAuth) {
        const { user, accessToken, refreshToken } = data.googleAuth;

        // Store tokens
        setAccessToken(accessToken);
        await SecureStore.setItemAsync("refreshToken", refreshToken);

        setUser(user);
      }
    } catch (error: any) {
      console.error("Google sign in error:", error);

      let message = "Google sign in failed";
      if (error.code === "SIGN_IN_CANCELLED") {
        message = "Google sign in was cancelled";
      } else if (error.code === "IN_PROGRESS") {
        message = "Google sign in already in progress";
      } else if (error.code === "PLAY_SERVICES_NOT_AVAILABLE") {
        message = "Play services not available";
      } else if (error.graphQLErrors?.[0]?.message) {
        message = error.graphQLErrors[0].message;
      } else if (error.message) {
        message = error.message;
      }

      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
    */
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

      // Sign out from Google if signed in
      // const isGoogleSignedIn = await GoogleSignin.isSignedIn();
      // if (isGoogleSignedIn) {
      //   await GoogleSignin.signOut();
      // }

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
        register,
        loginWithGoogle,
        logout,
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
