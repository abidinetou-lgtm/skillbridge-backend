"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const env_1 = require("./env");
if (!env_1.env.databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize Prisma");
}
const adapter = new adapter_pg_1.PrismaPg(env_1.env.databaseUrl);
// Reuse one PrismaClient instance across the app to avoid opening too many DB connections.
exports.prisma = new client_1.PrismaClient({ adapter });
//# sourceMappingURL=prisma.js.map