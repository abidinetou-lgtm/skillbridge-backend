declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: "development" | "test" | "production";
    PORT?: string;
    CORS_ORIGIN?: string;
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    PASSWORD_RESET_URL?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
  }
}
