import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createDb } from "@tracklane/db";
import { buildApp } from "../src/app";
import type { Config } from "../src/config";
import { badRequest } from "../src/lib/errors";

// Fail loudly instead of letting pg fall back to its defaults (localhost:5432).
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set; tests load it from the root .env");
}

const testConfig: Config = {
  NODE_ENV: "test",
  PORT: 3000,
  LOG_LEVEL: "silent",
  DATABASE_URL: databaseUrl,
  REDIS_URL: "redis://localhost:6380",
};

// Nothing listens on port 1, so connecting fails immediately.
const UNREACHABLE_DB_URL = "postgresql://x:x@127.0.0.1:1/x";

describe("api app", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp(testConfig, { db: createDb(testConfig.DATABASE_URL) });
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /health returns ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("returns NOT_FOUND for unknown routes", async () => {
    const res = await app.inject({ method: "GET", url: "/nope" });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Route GET /nope not found" },
    });
  });

  it("turns a thrown HttpError into its status and shape", async () => {
    app.get("/test/bad-request", async () => {
      throw badRequest("Title is required");
    });

    const res = await app.inject({ method: "GET", url: "/test/bad-request" });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: { code: "BAD_REQUEST", message: "Title is required" } });
  });

  it("hides internal details on 500", async () => {
    app.get("/test/crash", async () => {
      throw new Error("connection to postgres failed");
    });

    const res = await app.inject({ method: "GET", url: "/test/crash" });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
    });
    expect(res.body).not.toContain("connection to postgres failed");
  });

  it("returns BAD_REQUEST for malformed JSON", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/health",
      headers: { "content-type": "application/json" },
      payload: "bad json",
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      error: {
        code: "BAD_REQUEST",
        message: "Body is not valid JSON but content-type is set to 'application/json'",
      },
    });
  });

  it("GET /ready returns 200 when the database is reachable", async () => {
    const res = await app.inject({ method: "GET", url: "/ready" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ready", database: "up" });
  });

  it("GET /ready returns 503 when the database is unreachable", async () => {
    const downApp = buildApp(testConfig, { db: createDb(UNREACHABLE_DB_URL) });

    try {
      const res = await downApp.inject({ method: "GET", url: "/ready" });

      expect(res.statusCode).toBe(503);
      expect(res.json()).toEqual({ status: "not_ready", database: "down" });
    } finally {
      await downApp.close();
    }
  });
});
