import { describe, it, expect, beforeEach } from "vitest";
import {
  register,
  login,
  refreshAccessToken,
  revokeRefreshToken,
  verifyAccessToken,
  AuthError,
} from "../../src/services/auth.service.js";
import { RefreshToken } from "../../src/models/refresh-token.model.js";

describe("auth.service", () => {
  describe("register", () => {
    it("should create a user and return tokens", async () => {
      const result = await register("testuser", "test@example.com", "password123");

      expect(result.user.username).toBe("testuser");
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.passwordHash).toBeTruthy();
      expect(result.user.authProvider).toBe("email");
      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
      // Phase 1 fields preserved
      expect(result.user.xp).toBe(0);
      expect(result.user.level).toBe(1);
      expect(result.user.currentStreak).toBe(0);
      expect(result.user.achievements).toEqual([]);
    });

    it("should reject duplicate email", async () => {
      await register("user1", "dup@example.com", "password123");
      await expect(
        register("user2", "dup@example.com", "password123"),
      ).rejects.toThrow(AuthError);
    });

    it("should reject duplicate username", async () => {
      await register("sameuser", "a@example.com", "password123");
      await expect(
        register("sameuser", "b@example.com", "password123"),
      ).rejects.toThrow(AuthError);
    });

    it("should hash password with bcrypt (not store plaintext)", async () => {
      const result = await register("hashtest", "hash@example.com", "mypassword");
      expect(result.user.passwordHash).not.toBe("mypassword");
      expect(result.user.passwordHash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      await register("loginuser", "login@example.com", "correctpass");
    });

    it("should login with correct credentials", async () => {
      const result = await login("login@example.com", "correctpass");
      expect(result.user.username).toBe("loginuser");
      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
    });

    it("should reject wrong password", async () => {
      await expect(
        login("login@example.com", "wrongpass"),
      ).rejects.toThrow(AuthError);
    });

    it("should reject non-existent email", async () => {
      await expect(
        login("nobody@example.com", "anything"),
      ).rejects.toThrow(AuthError);
    });
  });

  describe("JWT", () => {
    it("should verify a valid access token", async () => {
      const { tokens } = await register("jwtuser", "jwt@example.com", "password123");
      const payload = verifyAccessToken(tokens.accessToken);
      expect(payload.userId).toBeTruthy();
    });

    it("should reject an invalid token", () => {
      expect(() => verifyAccessToken("invalid.token.here")).toThrow(AuthError);
    });
  });

  describe("refresh token", () => {
    it("should refresh and rotate tokens", async () => {
      const { tokens } = await register("refreshuser", "refresh@example.com", "password123");

      const newTokens = await refreshAccessToken(tokens.refreshToken);
      expect(newTokens.accessToken).toBeTruthy();
      expect(newTokens.refreshToken).toBeTruthy();
      expect(newTokens.refreshToken).not.toBe(tokens.refreshToken);

      // Old token should be deleted
      const oldToken = await RefreshToken.findOne({ token: tokens.refreshToken });
      expect(oldToken).toBeNull();
    });

    it("should reject invalid refresh token", async () => {
      await expect(refreshAccessToken("invalid-token")).rejects.toThrow(AuthError);
    });
  });

  describe("revoke", () => {
    it("should revoke a refresh token", async () => {
      const { tokens } = await register("revokeuser", "revoke@example.com", "password123");
      await revokeRefreshToken(tokens.refreshToken);

      const stored = await RefreshToken.findOne({ token: tokens.refreshToken });
      expect(stored).toBeNull();
    });
  });
});
