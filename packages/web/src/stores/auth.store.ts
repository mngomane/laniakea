import { create } from "zustand";

interface UserTeamEntry {
  teamId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  emailDigest: "instant" | "daily" | "weekly" | "off";
  mutedTypes: string[];
}

interface User {
  _id: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  authProvider: "github" | "email" | "both";
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  achievements: string[];
  teams: UserTeamEntry[];
  role: "user" | "admin";
  notificationPreferences: NotificationPreferences;
  createdAt: string;
}

export type { UserTeamEntry, NotificationPreferences };

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export type { User };

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setAuth: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, isAuthenticated: true }),

  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),

  updateUser: (user) => set({ user }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    }),
}));
