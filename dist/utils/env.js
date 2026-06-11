"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv = require("dotenv");
dotenv.config();
const parsePort = (value) => {
    const port = Number(value ?? "5000");
    // Fail fast if PORT is invalid so deployment issues are caught immediately.
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error("PORT must be a positive integer");
    }
    return port;
};
const parseCorsOrigin = (value) => {
    if (!value) {
        return "http://localhost:5173";
    }
    const origins = value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
    return origins.length === 1 ? origins[0] : origins;
};
const nodeEnv = process.env.NODE_ENV ?? "development";
const developmentJwtSecret = "development-only-secret-change-me";
const parseJwtSecret = (value) => {
    const secret = value?.trim();
    if (nodeEnv === "production") {
        if (!secret ||
            secret.length < 32 ||
            secret === developmentJwtSecret ||
            secret === "change-me-in-production") {
            throw new Error("JWT_SECRET must be set to a secure value of at least 32 characters in production");
        }
    }
    return secret || developmentJwtSecret;
};
const parseJwtExpiresIn = (value) => {
    const expiresIn = value?.trim() || "7d";
    if (!/^\d+(ms|s|m|h|d|w|y)$/.test(expiresIn)) {
        throw new Error("JWT_EXPIRES_IN must be a duration such as 15m, 1h, or 7d");
    }
    return expiresIn;
};
exports.env = {
    nodeEnv,
    port: parsePort(process.env.PORT),
    corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: parseJwtSecret(process.env.JWT_SECRET),
    jwtExpiresIn: parseJwtExpiresIn(process.env.JWT_EXPIRES_IN)
};
//# sourceMappingURL=env.js.map