import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "./schema.js";

/**
 * Unified database client type that accepts either a full DB connection
 * or a transaction handle. Use in service functions to enable
 * transactional propagation:
 *
 * @example
 * ```ts
 * async function createUser(data: NewUser, client: DbClient = getDb()) {
 *   return client.insert(users).values(data).returning();
 * }
 * ```
 */
export type DbClient = PostgresJsDatabase<typeof schema>;
