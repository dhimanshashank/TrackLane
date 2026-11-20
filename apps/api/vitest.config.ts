import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

// Load the root .env so integration tests get the real DATABASE_URL.
// In CI there is no .env file; the environment provides the variables instead.
const envPath = new URL("../../.env", import.meta.url);
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

export default defineConfig({});
