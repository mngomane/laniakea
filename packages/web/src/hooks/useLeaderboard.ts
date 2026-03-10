import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGameStore } from "../stores/game.store.js";
import type { LeaderboardEntry } from "../stores/game.store.js";
import { useAuthStore } from "../stores/auth.store.js";

interface WsMessage {
  type: string;
  data: LeaderboardEntry[];
}

export function useLeaderboard() {
  const setLeaderboard = useGameStore((s) => s.setLeaderboard);
  const leaderboard = useGameStore((s) => s.leaderboard);
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  const query = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = (await res.json()) as LeaderboardEntry[];
      setLeaderboard(data);
      return data;
    },
    staleTime: 15_000,
    // Fallback polling only when WebSocket is not connected
    refetchInterval: wsRef.current?.readyState === WebSocket.OPEN ? false : 30_000,
  });

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const accessToken = useAuthStore.getState().accessToken ?? "";
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(accessToken)}`;

    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WsMessage;
          if (msg.type === "leaderboard:update") {
            setLeaderboard(msg.data);
            queryClient.setQueryData(["leaderboard"], msg.data);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        // Reconnect after 5 seconds
        setTimeout(connect, 5_000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      const ws = wsRef.current;
      if (ws) {
        ws.onclose = null; // Prevent reconnect on cleanup
        ws.close();
        wsRef.current = null;
      }
    };
  }, [setLeaderboard, queryClient]);

  return { ...query, leaderboard: query.data ?? leaderboard };
}
