declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: "development" | "test" | "production";
    PORT?: string;
    CORS_ORIGIN?: string;
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    APP_URL?: string;
    FRONTEND_URL?: string;
    GMAIL_USER?: string;
    GMAIL_APP_PASSWORD?: string;
    REQUIRE_EMAIL_VERIFICATION?: string;
  }
}
