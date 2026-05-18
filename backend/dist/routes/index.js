"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const healthRoutes_1 = __importDefault(require("./healthRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const router = (0, express_1.Router)();
// Mount feature route files here. Example: router.use("/users", userRoutes);
router.use("/", healthRoutes_1.default);
router.use("/auth", authRoutes_1.default);
router.use("/users", userRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map