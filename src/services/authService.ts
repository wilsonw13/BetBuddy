import axios, { AxiosInstance, AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

// Replace with your local IP address or deployed backend URL
const API_BASE_URL = "http://192.168.1.100:3000/api/auth";

interface User {
  id: string;
  email: string;
  display_name: string;
  profile_picture?: string;
  email_verified: boolean;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class AuthService {
  private api: AxiosInstance;
  private accessToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor - add access token
    this.api.interceptors.request.use(
      async (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor - handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // If 401 and we haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for token refresh to complete
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.api(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newTokens = await this.refreshToken();
            this.accessToken = newTokens.accessToken;
            this.isRefreshing = false;

            // Retry all queued requests with new token
            this.refreshSubscribers.forEach((callback) =>
              callback(newTokens.accessToken),
            );
            this.refreshSubscribers = [];

            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;
            this.refreshSubscribers = [];
            // Token refresh failed, user needs to login again
            await this.clearTokens();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  // Register with email/password
  async registerWithEmail(
    email: string,
    password: string,
    displayName: string,
  ): Promise<AuthResponse> {
    try {
      const response = await this.api.post<ApiResponse<AuthResponse>>(
        "/register",
        {
          email,
          password,
          display_name: displayName,
        },
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Registration failed");
      }

      const { accessToken, refreshToken, user } = response.data.data;
      await this.storeTokens(accessToken, refreshToken);
      this.accessToken = accessToken;

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || error.message || "Registration failed",
      );
    }
  }

  // Login with email/password
  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.api.post<ApiResponse<AuthResponse>>(
        "/login",
        {
          email,
          password,
        },
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Login failed");
      }

      const { accessToken, refreshToken, user } = response.data.data;
      await this.storeTokens(accessToken, refreshToken);
      this.accessToken = accessToken;

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || error.message || "Login failed",
      );
    }
  }

  // Login with Google
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      const response = await this.api.post<ApiResponse<AuthResponse>>(
        "/google/mobile",
        {
          idToken,
        },
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Google login failed");
      }

      const { accessToken, refreshToken, user } = response.data.data;
      await this.storeTokens(accessToken, refreshToken);
      this.accessToken = accessToken;

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || error.message || "Google login failed",
      );
    }
  }

  // Refresh access token
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await this.api.post<
        ApiResponse<{ accessToken: string; refreshToken: string }>
      >("/refresh", {
        refreshToken,
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Token refresh failed");
      }

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      await this.storeTokens(accessToken, newRefreshToken);
      this.accessToken = accessToken;

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || error.message || "Token refresh failed",
      );
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");

      if (refreshToken) {
        await this.api.post("/logout", { refreshToken });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await this.clearTokens();
    }
  }

  // Get stored access token (for auto-login)
  async getAccessToken(): Promise<string | null> {
    if (this.accessToken) {
      return this.accessToken;
    }

    // Try to refresh if we have a refresh token
    try {
      const { accessToken } = await this.refreshToken();
      return accessToken;
    } catch (error) {
      return null;
    }
  }

  // Store tokens securely
  private async storeTokens(
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    await SecureStore.setItemAsync("refreshToken", refreshToken);
    this.accessToken = accessToken;
  }

  // Clear tokens
  private async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync("refreshToken");
    this.accessToken = null;
  }
}

export const authService = new AuthService();
export type { User, AuthResponse };
