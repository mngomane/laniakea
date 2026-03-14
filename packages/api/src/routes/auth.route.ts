import { Hono } from "hono";
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
import { env } from "../config/env.js";

export const authRoute = new Hono<AppEnv>();

authRoute.post("/register", async (c) => {
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

authRoute.post("/login", async (c) => {
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

authRoute.get("/github", (c) => {
  const redirectUri = `${c.req.url.replace("/auth/github", "/auth/github/callback")}`;
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "user:email",
  });
  return c.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

authRoute.get("/github/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) {
    return c.json({ error: "Missing code parameter" }, 400);
  }

  const { user, tokens } = await githubOAuth(code);
  return c.json({ user: stripPasswordHash(user), tokens }, 200);
});

authRoute.post("/refresh", async (c) => {
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
