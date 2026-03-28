import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
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
  refreshAccessToken,
  revokeRefreshToken,
} from "../services/auth.service.js";
import { stripPasswordHash } from "../services/user.service.js";
import {
  generateOAuthState,
  storeOAuthTokens,
  exchangeOAuthCode,
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

  const redirectUri = `${c.req.url.replace("/auth/github", "/auth/github/callback")}`;
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
  const code = (body as { code?: string }).code;
  if (!code || typeof code !== "string") {
    return c.json({ error: "Missing code" }, 400);
  }
  const tokens = exchangeOAuthCode(code);
  if (!tokens) {
    return c.json({ error: "Invalid or expired code" }, 401);
  }
  return c.json({ tokens }, 200);
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
