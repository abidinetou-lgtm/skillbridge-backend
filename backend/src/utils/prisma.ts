import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize Prisma");
}

const adapter = new PrismaPg(env.databaseUrl);

// Reuse one PrismaClient instance across the app to avoid opening too many DB connections.
export const prisma = new PrismaClient({ adapter });
