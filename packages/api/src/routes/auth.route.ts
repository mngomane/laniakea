import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import type { AppEnv } from "../types/index.js";
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
} from "../types/index.js";
import {
  register,
  login,
  githubOAuth,
  linkGitHub,
  refreshAccessToken,
  revokeRefreshToken,
} from "../services/auth.service.js";
import { stripPasswordHash } from "../services/user.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  generateOAuthState,
  storeOAuthTokens,
  exchangeOAuthCode,
  storeLinkRequest,
  getLinkRequest,
} from "../services/oauth-store.js";
import { rateLimiter } from "../middleware/rate-limiter.js";
import { env } from "../config/env.js";

export const authRoute = new Hono<AppEnv>();

const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 15 });

authRoute.post("/register", authLimiter, async (c) => {
  const body = await c.req.json();
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      400,
    );
  }

  const { user, tokens } = await register(
    parsed.data.username,
    parsed.data.email,
    parsed.data.password,
  );
  return c.json({ user: stripPasswordHash(user), tokens }, 201);
});

authRoute.post("/login", authLimiter, async (c) => {
  const body = await c.req.json();
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      400,
    );
  }

  const { user, tokens } = await login(parsed.data.email, parsed.data.password);
  return c.json({ user: stripPasswordHash(user), tokens }, 200);
});

authRoute.get("/github", authLimiter, (c) => {
  const state = generateOAuthState();
  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 300,
    path: "/api/auth",
    secure: env.NODE_ENV === "production",
  });

  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace("/auth/github", "/auth/github/callback");
  url.search = "";
  const redirectUri = url.toString();
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "user:email",
    state,
  });
  return c.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );
});

authRoute.get("/github/callback", authLimiter, async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const storedState = getCookie(c, "oauth_state");

  deleteCookie(c, "oauth_state", { path: "/api/auth" });

  if (!code) {
    return c.redirect("/login?error=github_missing_code");
  }

  if (!state || !storedState || state !== storedState) {
    return c.redirect("/login?error=github_invalid_state");
  }

  try {
    const { tokens } = await githubOAuth(code);
    const exchangeCode = storeOAuthTokens(tokens);
    return c.redirect(`/auth/callback?code=${exchangeCode}`);
  } catch {
    return c.redirect("/login?error=github_auth_failed");
  }
});

authRoute.post("/exchange", authLimiter, async (c) => {
  const body = await c.req.json();
  const parsed = z.object({ code: z.string() }).safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Missing code" }, 400);
  }
  const tokens = exchangeOAuthCode(parsed.data.code);
  if (!tokens) {
    return c.json({ error: "Invalid or expired code" }, 401);
  }
  return c.json({ tokens }, 200);
});

// --- Link GitHub to existing account (requires auth) ---

authRoute.get("/github/link", authMiddleware, authLimiter, (c) => {
  const userId = c.get("userId");
  const state = generateOAuthState();
  const linkToken = storeLinkRequest(userId);

  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    sameSite: "Strict",
    maxAge: 300,
    path: "/api/auth",
    secure: env.NODE_ENV === "production",
  });
  setCookie(c, "oauth_link_token", linkToken, {
    httpOnly: true,
    sameSite: "Strict",
    maxAge: 300,
    path: "/api/auth",
    secure: env.NODE_ENV === "production",
  });

  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace("/auth/github/link", "/auth/github/link/callback");
  url.search = "";
  const redirectUri = url.toString();
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "user:email",
    state,
  });
  return c.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );
});

authRoute.get("/github/link/callback", authMiddleware, authLimiter, async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const storedState = getCookie(c, "oauth_state");
  const linkToken = getCookie(c, "oauth_link_token");

  deleteCookie(c, "oauth_state", { path: "/api/auth" });
  deleteCookie(c, "oauth_link_token", { path: "/api/auth" });

  if (!code || !state || !storedState || state !== storedState || !linkToken) {
    return c.redirect("/settings?error=github_link_failed");
  }

  const userId = getLinkRequest(linkToken);
  if (!userId) {
    return c.redirect("/settings?error=github_link_expired");
  }

  // Verify authenticated user matches the link request
  if (userId !== c.get("userId")) {
    return c.json({ error: "Forbidden: user mismatch" }, 403);
  }

  try {
    await linkGitHub(userId, code);
    return c.redirect("/settings?linked=github");
  } catch {
    return c.redirect("/settings?error=github_link_failed");
  }
});

authRoute.post("/refresh", authLimiter, async (c) => {
  const body = await c.req.json();
  const parsed = RefreshTokenSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      400,
    );
  }

  const tokens = await refreshAccessToken(parsed.data.refreshToken);
  return c.json({ tokens }, 200);
});

authRoute.post("/logout", async (c) => {
  const body = await c.req.json();
  const parsed = RefreshTokenSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      400,
    );
  }

  await revokeRefreshToken(parsed.data.refreshToken);
  return c.json({ message: "Logged out" }, 200);
});
