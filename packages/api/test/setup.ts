import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, afterAll, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema.js";

// Set test env vars before any module loads env
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET =
  "test-jwt-secret-at-least-thirty-two-characters-long";
process.env.JWT_REFRESH_SECRET =
  "test-jwt-refresh-secret-at-least-thirty-two-chars";
process.env.GITHUB_WEBHOOK_SECRET =
  "test-webhook-secret-min-32-characters-long";

const __dirname = dirname(fileURLToPath(import.meta.url));

let pg: PGlite;

beforeAll(async () => {
  pg = new PGlite();

  const db = drizzle(pg, { schema });

  // Create enums and tables via raw DDL
  const ddl = readFileSync(join(__dirname, "ddl.sql"), "utf-8");
  await pg.exec(ddl);

  // Apply triggers
  const triggers = readFileSync(
    join(__dirname, "../src/db/triggers.sql"),
    "utf-8",
  );
  await pg.exec(triggers);

  // Inject the DB into the database module so getDb() works
  const dbModule = await import("../src/config/database.js");
  // @ts-expect-error -- accessing private module state for tests
  dbModule.__setTestDb(db);
});

afterEach(async () => {
  // Truncate all tables between tests (order matters for FK constraints)
  const db = (await import("../src/config/database.js")).getDb();
  await db.execute(sql`
    TRUNCATE
      team_members,
      user_achievements,
      refresh_tokens,
      notifications,
      activities,
      teams,
      achievements,
      users
    CASCADE
  `);
});

afterAll(async () => {
  const dbModule = await import("../src/config/database.js");
  // @ts-expect-error -- accessing private module state for tests
  dbModule.__setTestDb(null);
  await pg.close();
});
