import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { usersRoute } from "../../src/routes/users.route.js";
import { authRoute } from "../../src/routes/auth.route.js";
import { errorHandler } from "../../src/middleware/error-handler.js";
import mongoose from "mongoose";

const app = new Hono();
app.onError(errorHandler);
app.route("/api/auth", authRoute);
app.route("/api/users", usersRoute);

async function getAuthToken(): Promise<string> {
  const res = await app.request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "authuser",
      email: "auth@example.com",
      password: "password123",
    }),
  });
  const body = (await res.json()) as { tokens: { accessToken: string } };
  return body.tokens.accessToken;
}

describe("users.route", () => {
  let token: string;

  beforeEach(async () => {
    token = await getAuthToken();
  });

  it("POST /api/users with valid body returns 201", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username: "routeuser" }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.username).toBe("routeuser");
  });

  it("POST /api/users with invalid body returns 400", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username: "ab" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("GET /api/users/:id returns 200 for existing user", async () => {
    const createRes = await app.request("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username: "getuser" }),
    });
    const created = (await createRes.json()) as { _id: string };

    const res = await app.request(`/api/users/${created._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.username).toBe("getuser");
  });

  it("GET /api/users/:nonexistent returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await app.request(`/api/users/${fakeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });

  it("returns 401 without auth token", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "noauth" }),
    });

    expect(res.status).toBe(401);
  });
});
