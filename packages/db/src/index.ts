import type { Kysely } from "kysely";
import type { DB } from "./types";

export { createDb } from "./client";
export type { DB } from "./types";
export type Database = Kysely<DB>;
export { sql } from "kysely";
