import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
    app.get("/health", async (request, reply) => {
        return reply.send({ status: "OK" })
    } )
}