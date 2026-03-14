import type { WebSocket } from "ws";

const connections = new Map<string, Set<WebSocket>>();

export function addConnection(userId: string, ws: WebSocket): void {
  let userSockets = connections.get(userId);
  if (!userSockets) {
    userSockets = new Set();
    connections.set(userId, userSockets);
  }
  userSockets.add(ws);
}

export function removeConnection(userId: string, ws: WebSocket): void {
  const userSockets = connections.get(userId);
  if (userSockets) {
    userSockets.delete(ws);
    if (userSockets.size === 0) {
      connections.delete(userId);
    }
  }
}

export function getConnectionsForUser(userId: string): ReadonlySet<WebSocket> {
  return connections.get(userId) ?? new Set();
}

export function getAllConnections(): Map<string, Set<WebSocket>> {
  return connections;
}

export function connectionCount(): number {
  let count = 0;
  for (const sockets of connections.values()) {
    count += sockets.size;
  }
  return count;
}
