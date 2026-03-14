import { describe, it, expect } from "vitest";
import { v7 as uuidv7 } from "uuid";
import {
  createUser,
  getUserById,
  NotFoundError,
} from "../../src/services/user.service.js";

describe("user.service", () => {
  describe("createUser", () => {
    it("should create a user successfully", async () => {
      const user = await createUser({ username: "testuser" });

      expect(user.username).toBe("testuser");
      expect(user.xp).toBe(0);
      expect(user.level).toBe(1);
      expect(user.currentStreak).toBe(0);
      expect(user.longestStreak).toBe(0);
      expect(user.lastActivityDate).toBeNull();
    });

    it("should reject duplicate usernames", async () => {
      await createUser({ username: "duplicate" });

      await expect(createUser({ username: "duplicate" })).rejects.toThrow();
    });
  });

  describe("getUserById", () => {
    it("should return a user by id", async () => {
      const created = await createUser({ username: "findme" });
      const found = await getUserById(created.id);

      expect(found.username).toBe("findme");
    });

    it("should throw NotFoundError for non-existent id", async () => {
      const fakeId = uuidv7();

      await expect(getUserById(fakeId)).rejects.toThrow(NotFoundError);
    });
  });
});
