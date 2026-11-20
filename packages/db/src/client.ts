import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import type { DB } from "./types";

export function createDb(connectionString: string): Kysely<DB> {
  const pool = new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 2000,
  });

  pool.on("error", (err) => {
    console.error("[DB] idle client error:", err.message);
  });

  return new Kysely<DB>({
    dialect: new PostgresDialect({ pool }),
  });
}
