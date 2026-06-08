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

const nodeEnv = process.env.NODE_ENV ?? "development";
const developmentJwtSecret = "development-only-secret-change-me";

const parseJwtSecret = (value: string | undefined): string => {
  const secret = value?.trim();

  if (nodeEnv === "production") {
    if (
      !secret ||
      secret.length < 32 ||
      secret === developmentJwtSecret ||
      secret === "change-me-in-production"
    ) {
      throw new Error(
        "JWT_SECRET must be set to a secure value of at least 32 characters in production"
      );
    }
  }

  return secret || developmentJwtSecret;
};

const parseJwtExpiresIn = (value: string | undefined): string => {
  const expiresIn = value?.trim() || "7d";

  if (!/^\d+(ms|s|m|h|d|w|y)$/.test(expiresIn)) {
    throw new Error(
      "JWT_EXPIRES_IN must be a duration such as 15m, 1h, or 7d"
    );
  }

  return expiresIn;
};

const parseUrl = (value: string | undefined, fallback: string): string => {
  const url = value?.trim() || fallback;

  try {
    return new URL(url).toString();
  } catch {
    throw new Error("PASSWORD_RESET_URL must be a valid absolute URL");
  }
};

export const env = {
  nodeEnv,
  port: parsePort(process.env.PORT),
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: parseJwtSecret(process.env.JWT_SECRET),
  jwtExpiresIn: parseJwtExpiresIn(process.env.JWT_EXPIRES_IN),
  passwordResetUrl: parseUrl(
    process.env.PASSWORD_RESET_URL,
    "http://localhost:5173/reset-password"
  ),
  resendApiKey: process.env.RESEND_API_KEY?.trim(),
  emailFrom: process.env.EMAIL_FROM?.trim()
};
