import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema.js";
import { applyTriggers } from "../db/apply-triggers.js";
import type { DbClient } from "../db/types.js";

let db: DbClient | null = null;
let client: postgres.Sql | null = null;

export async function connectDatabase(url: string): Promise<void> {
  client = postgres(url);
  db = drizzle(client, { schema });
  await applyTriggers(db);
}

export function getDb(): DbClient {
  if (!db) {
    throw new Error("Database not connected. Call connectDatabase() first.");
  }
  return db;
}

export async function disconnectDatabase(): Promise<void> {
  if (client) {
    await client.end();
    client = null;
    db = null;
  }
}

/** @internal Test-only: inject a PGlite-backed Drizzle instance */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function __setTestDb(testDb: any): void {
  db = testDb;
}
