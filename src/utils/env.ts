import dotenv = require("dotenv");

dotenv.config();

const parsePort = (value: string | undefined): number => {
  const port = Number(value ?? "5000");

  // Fail fast if PORT is invalid so deployment issues are caught immediately.
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  return port;
};

const parseCorsOrigin = (value: string | undefined): string | string[] => {
  if (!value) {
    return "http://localhost:5173";
  }

  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length === 1 ? origins[0] : origins;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? "development-only-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d"
};
