import Fastify, { type FastifyError } from "fastify";
import type { Config } from "./config";
import { HttpError } from "./lib/errors";
import { healthRoutes } from "./routes/health";

export function buildApp(config: Config) {
    const app = Fastify({
        logger:
            config.NODE_ENV === 'development'
                ? {
                    level: config.LOG_LEVEL,
                    transport: {
                        target: "pino-pretty",
                        options: { translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
                    }
                } : { level: config.LOG_LEVEL },
    })

    app.setErrorHandler((error: FastifyError, request, reply) => {
        // Errors we threw on purpose
        if (error instanceof HttpError) {
            return reply
                .code(error.statusCode)
                .send({
                    error: { code: error.code, message: error.message }
                });
        }

        // Request failed schema validation
        if (error.validation) {
            return reply
                .code(400)
                .send({
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Request failed validation",
                        details: error.validation
                    }
                })
        }

        // Fastify's own client errors
        if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
            return reply
                .code(error.statusCode)
                .send({ error: { code: error.code ?? "BAD_REQUEST", message: error.message } });
        }

        request.log.error({ err: error }, "unhandled error");
        return reply
            .code(500)
            .send({ error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } })
    });

    app.setNotFoundHandler((request, reply) => {
        return reply.code(404).send({
            error: { code: "NOT_FOUND", message: `Route ${request.method} ${request.url} not found` },
        });
    });

    app.register(healthRoutes);

    return app;
}