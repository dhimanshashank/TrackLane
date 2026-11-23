import { Migrator, FileMigrationProvider } from "kysely/migration";
import { createDb } from "./client";
import { pathToFileURL } from "node:url";
import { promises as fs } from "node:fs";
import path from "node:path";

async function runMigrations() {
  const url = process.env.DATABASE_URL;

  if (!url) throw new Error("DATABASE_URL is not set");

  const db = createDb(url);

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(import.meta.dirname, "../migrations"),
      import: (filePath) => import(pathToFileURL(filePath).href),
    }),
  });

  try {
    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((it) => {
      switch (it.status) {
        case "Success":
          console.log(`migration "${it.migrationName}" was executed successfully`);
          break;
        case "Error":
          console.error(`failed to execute migration "${it.migrationName}"`);
          break;
        case "NotExecuted":
          console.error(`skipped migration "${it.migrationName}"`);
          break;
        default: {
          const unhandled: never = it.status;
          throw new Error(`unknown migration status: ${unhandled}`);
        }
      }
    });

    if (error) {
      console.error("migration failed:", error);
      console.error("the whole batch was rolled back; no migration in this run was applied");
      process.exitCode = 1;
    } else if (!results?.length) {
      console.log("no pending migrations");
    }
  } finally {
    await db.destroy();
  }
}

await runMigrations();
