import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "node:http";
import { addConnection, removeConnection } from "./connections.js";
import { verifyAccessToken } from "../services/auth.service.js";

const HEARTBEAT_INTERVAL = 30_000;

export function setupWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  // Heartbeat to detect dead connections
  const interval = setInterval(() => {
    for (const ws of wss.clients) {
      const extWs = ws as WebSocket & { isAlive?: boolean; userId?: string };
      if (extWs.isAlive === false) {
        if (extWs.userId) removeConnection(extWs.userId, ws);
        ws.terminate();
        continue;
      }
      extWs.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL);

  wss.on("connection", (ws, req) => {
    const extWs = ws as WebSocket & { isAlive?: boolean; userId?: string };

    // Parse token from query string
    const url = new URL(req.url ?? "/", "http://localhost");
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(4001, "Unauthorized");
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      extWs.userId = payload.userId;
    } catch {
      ws.close(4001, "Unauthorized");
      return;
    }

    extWs.isAlive = true;
    addConnection(extWs.userId, ws);

    ws.on("pong", () => {
      extWs.isAlive = true;
    });

    ws.on("close", () => {
      if (extWs.userId) removeConnection(extWs.userId, ws);
    });

    ws.on("error", () => {
      if (extWs.userId) removeConnection(extWs.userId, ws);
    });
  });

  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
}
