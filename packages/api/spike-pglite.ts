/**
 * Spike: Validate PGlite support for PostgreSQL features needed by migration.
 *
 * Tests:
 *  1. CREATE TYPE ... AS ENUM + insert/query
 *  2. JSONB column + ->> operator
 *  3. Partial unique index (CREATE UNIQUE INDEX ... WHERE ...)
 *
 * Run: npx tsx spike-pglite.ts
 */

import { PGlite } from "@electric-sql/pglite";

async function main(): Promise<void> {
  const db = new PGlite();

  // ── 1. Enum support ──────────────────────────────────────────────
  console.log("=== Test 1: ENUM ===");
  await db.exec(`CREATE TYPE activity_type AS ENUM ('Commit', 'PullRequest', 'Review', 'Issue', 'Merge')`);
  await db.exec(`
    CREATE TABLE activities_spike (
      id SERIAL PRIMARY KEY,
      type activity_type NOT NULL
    )
  `);
  await db.exec(`INSERT INTO activities_spike (type) VALUES ('Commit'), ('PullRequest')`);
  const enumResult = await db.query<{ id: number; type: string }>(
    `SELECT * FROM activities_spike WHERE type = 'Commit'`
  );
  console.log("Enum rows:", enumResult.rows);
  const enumPass = enumResult.rows.length === 1 && enumResult.rows[0]?.type === "Commit";
  console.log("ENUM:", enumPass ? "PASS ✓" : "FAIL ✗");

  // ── 2. JSONB support ─────────────────────────────────────────────
  console.log("\n=== Test 2: JSONB ===");
  await db.exec(`
    CREATE TABLE metadata_spike (
      id SERIAL PRIMARY KEY,
      data JSONB NOT NULL
    )
  `);
  await db.exec(`INSERT INTO metadata_spike (data) VALUES ('{"repo": "laniakea", "branch": "main"}'::jsonb)`);
  const jsonbResult = await db.query<{ repo: string }>(
    `SELECT data->>'repo' AS repo FROM metadata_spike WHERE data->>'branch' = 'main'`
  );
  console.log("JSONB rows:", jsonbResult.rows);
  const jsonbPass = jsonbResult.rows.length === 1 && jsonbResult.rows[0]?.repo === "laniakea";
  console.log("JSONB:", jsonbPass ? "PASS ✓" : "FAIL ✗");

  // ── 3. Partial unique index ───────────────────────────────────────
  console.log("\n=== Test 3: Partial Unique Index ===");
  await db.exec(`
    CREATE TABLE users_spike (
      id SERIAL PRIMARY KEY,
      email TEXT,
      github_id TEXT,
      deleted BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);
  await db.exec(`CREATE UNIQUE INDEX idx_users_email_active ON users_spike (email) WHERE deleted = FALSE`);
  await db.exec(`INSERT INTO users_spike (email, deleted) VALUES ('a@b.com', FALSE)`);
  // Same email but deleted = TRUE should succeed (not covered by partial index)
  await db.exec(`INSERT INTO users_spike (email, deleted) VALUES ('a@b.com', TRUE)`);

  let partialPass = true;
  try {
    // Same email + deleted = FALSE should fail (unique violation)
    await db.exec(`INSERT INTO users_spike (email, deleted) VALUES ('a@b.com', FALSE)`);
    partialPass = false; // Should not reach here
  } catch {
    // Expected: unique constraint violation
  }

  const countResult = await db.query<{ count: string }>(`SELECT count(*) AS count FROM users_spike`);
  const count = Number(countResult.rows[0]?.count);
  partialPass = partialPass && count === 2;
  console.log("Row count:", count, "(expected 2)");
  console.log("PARTIAL UNIQUE INDEX:", partialPass ? "PASS ✓" : "FAIL ✗");

  // ── Summary ───────────────────────────────────────────────────────
  console.log("\n=== Summary ===");
  const allPass = enumPass && jsonbPass && partialPass;
  console.log(`Overall: ${allPass ? "ALL PASS ✓" : "SOME FAILED ✗"}`);

  await db.close();
  process.exit(allPass ? 0 : 1);
}

main().catch((err: unknown) => {
  console.error("Spike failed:", err);
  process.exit(1);
});
