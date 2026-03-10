import { create } from "zustand";

interface Activity {
  _id: string;
  userId: string;
  type: string;
  xpAwarded: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  xp: number;
  level: number;
  currentStreak: number;
  rank: number;
}

interface GameState {
  activities: Activity[];
  leaderboard: LeaderboardEntry[];
  setActivities: (activities: Activity[]) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  updateLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
}

export type { Activity, LeaderboardEntry };

export const useGameStore = create<GameState>((set) => ({
  activities: [],
  leaderboard: [],

  setActivities: (activities) => set({ activities }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  updateLeaderboard: (leaderboard) => set({ leaderboard }),
}));
