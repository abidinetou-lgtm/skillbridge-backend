declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: "development" | "test" | "production";
    PORT?: string;
    CORS_ORIGIN?: string;
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    APP_URL?: string;
    PASSWORD_RESET_URL?: string;
    RESEND_API_KEY?: string;
    RESEND_FROM_EMAIL?: string;
    REQUIRE_EMAIL_VERIFICATION?: string;
  }
}
