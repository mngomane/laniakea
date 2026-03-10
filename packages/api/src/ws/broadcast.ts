import { WebSocket } from "ws";
import { getAllConnections, getConnectionsForUser } from "./connections.js";
import { getAllUsers } from "../services/user.service.js";
import { sortUserLeaderboard } from "../services/gamification.service.js";
import type { LeaderboardEntry } from "@laniakea/engine";

export async function broadcastLeaderboard(): Promise<void> {
  const connectionMap = getAllConnections();
  if (connectionMap.size === 0) return;

  const users = await getAllUsers();
  const entries: LeaderboardEntry[] = users.map((user) => ({
    userId: (user._id as { toString(): string }).toString(),
    username: user.username,
    xp: user.xp,
    level: user.level,
    currentStreak: user.currentStreak,
    rank: 0,
  }));

  const sorted = sortUserLeaderboard(entries);
  const payload = JSON.stringify({
    type: "leaderboard:update",
    data: sorted,
  });

  for (const sockets of connectionMap.values()) {
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}

export function sendToUser(userId: string, payload: unknown): void {
  const sockets = getConnectionsForUser(userId);
  const message = JSON.stringify(payload);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

export function broadcastNotification(userId: string, notification: unknown): void {
  sendToUser(userId, {
    type: "notification:new",
    data: notification,
  });
}
