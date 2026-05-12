import { PrismaClient } from "@prisma/client";

// Reuse one PrismaClient instance across the app to avoid opening too many DB connections.
export const prisma = new PrismaClient();
