import { useCallback } from "react";
import { useAuthStore } from "../stores/auth.store.js";
import { apiRequest } from "../api/client.js";
import type { User } from "../stores/auth.store.js";

interface AuthResponse {
  user: User;
  tokens: { accessToken: string; refreshToken: string };
}

export function useAuth() {
  const { user, isAuthenticated, setAuth, logout: storeLogout } = useAuthStore();

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const data = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      storeLogout(); // Clear any existing auth before setting new
      // Use raw fetch since apiRequest adds auth headers we don't have yet
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
    },
    [setAuth, storeLogout],
  );

  const registerWithEmail = useCallback(
    async (username: string, email: string, password: string) => {
      const data = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
    },
    [setAuth],
  );

  const loginWithGitHub = useCallback(() => {
    window.location.href = "/api/auth/github";
  }, []);

  const logout = useCallback(async () => {
    const { refreshToken } = useAuthStore.getState();
    if (refreshToken) {
      try {
        await apiRequest("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignore logout errors
      }
    }
    storeLogout();
  }, [storeLogout]);

  return {
    user,
    isAuthenticated,
    loginWithEmail,
    registerWithEmail,
    loginWithGitHub,
    logout,
  };
}
