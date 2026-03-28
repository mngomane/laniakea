import crypto from "node:crypto";
import type { TokenPair } from "./auth.service.js";

interface PendingExchange {
  tokens: TokenPair;
  expiresAt: number;
}

const store = new Map<string, PendingExchange>();
const TTL_MS = 60_000; // 60 seconds

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}, 30_000);
cleanup.unref();

export function storeOAuthTokens(tokens: TokenPair): string {
  const code = crypto.randomBytes(32).toString("hex");
  store.set(code, { tokens, expiresAt: Date.now() + TTL_MS });
  return code;
}

export function exchangeOAuthCode(code: string): TokenPair | null {
  const entry = store.get(code);
  if (!entry) return null;
  store.delete(code);
  if (entry.expiresAt <= Date.now()) return null;
  return entry.tokens;
}

export function generateOAuthState(): string {
  return crypto.randomBytes(16).toString("hex");
}
