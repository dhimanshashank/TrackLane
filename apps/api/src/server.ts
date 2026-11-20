import { config } from "./config";
import { buildApp } from "./app";
import { createDb, type Database } from "@tracklane/db";

// Wait for In-flight requests
const SHUTDOWN_TIMEOUT_MS = 10_000;

const db = createDb(config.DATABASE_URL);
const app = buildApp(config, { db });

try {
  await app.listen({ port: config.PORT, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error, "Failed to start the server");
  process.exit(1);
}

// Gracefully shutdown the server
let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;

  app.log.info({ signal }, "shutting down");

  const forceExit = setTimeout(() => {
    app.log.error("shutdown timed out, forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    await app.close();
    app.log.info("server closed");
    process.exit(0);
  } catch (error) {
    app.log.error(error, "error during shutdown");
    process.exit(1);
  }
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
