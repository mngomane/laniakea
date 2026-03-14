import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { DbClient } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Apply `set_updated_at()` function and triggers to all target tables.
 * Safe to call multiple times (uses CREATE OR REPLACE).
 *
 * Call in `connectDatabase()` (prod) and `beforeAll` (tests).
 */
export async function applyTriggers(db: DbClient): Promise<void> {
  const sql = readFileSync(join(__dirname, "triggers.sql"), "utf-8");
  await db.execute(sql);
}
