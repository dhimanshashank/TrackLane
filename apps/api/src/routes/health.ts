import type { FastifyInstance } from "fastify";
import { sql } from "@tracklane/db";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (request, reply) => {
    return reply.send({ status: "ok" });
  });

  app.get("/ready", async (request, reply) => {
    try {
      await sql`SELECT 1`.execute(app.db);
      return { status: "ready", database: "up" };
    } catch (err) {
      request.log.warn({ err }, "database not ready");
      return reply.code(503).send({ status: "not_ready", database: "down" });
    }
  });
}
