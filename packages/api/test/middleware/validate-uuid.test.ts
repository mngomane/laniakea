import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { validateUUID } from "../../src/middleware/validate-uuid.js";

describe("validateUUID middleware", () => {
  const app = new Hono();
  app.get("/items/:id", validateUUID("id"), (c) =>
    c.json({ ok: true }),
  );
  app.get("/nested/:userId/things/:thingId", validateUUID("userId", "thingId"), (c) =>
    c.json({ ok: true }),
  );

  it("should pass for a valid UUID", async () => {
    const res = await app.request(
      "/items/019510a0-76b3-7000-8000-000000000001",
    );
    expect(res.status).toBe(200);
  });

  it("should return 400 for an invalid UUID", async () => {
    const res = await app.request("/items/not-a-uuid");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid UUID");
    expect(body.error).toContain("id");
  });

  it("should validate multiple params", async () => {
    const valid = "019510a0-76b3-7000-8000-000000000001";
    const res = await app.request(`/nested/${valid}/things/bad`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("thingId");
  });

  it("should pass when all multiple params are valid UUIDs", async () => {
    const uuid1 = "019510a0-76b3-7000-8000-000000000001";
    const uuid2 = "019510a0-76b3-7000-8000-000000000002";
    const res = await app.request(`/nested/${uuid1}/things/${uuid2}`);
    expect(res.status).toBe(200);
  });
});
