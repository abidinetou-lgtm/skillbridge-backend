"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors = require("cors");
const express = require("express");
const helmet_1 = __importDefault(require("helmet"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const routes_1 = __importDefault(require("./routes"));
const env_1 = require("./utils/env");
const app = express();
app.use((0, helmet_1.default)());
// CORS controls which frontend applications are allowed to call this API.
app.use(cors({
    origin: env_1.env.corsOrigin,
    credentials: true
}));
// express.json() allows Express to read JSON request bodies from clients.
app.use(express.json());
// Keep route registration in one place so new feature routes are easy to add.
app.use(routes_1.default);
// Error middleware must be registered after routes so it can catch route errors.
app.use(errorMiddleware_1.errorMiddleware);
exports.default = app;
//# sourceMappingURL=app.js.map