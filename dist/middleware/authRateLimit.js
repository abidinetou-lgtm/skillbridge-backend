"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = void 0;
const express_rate_limit_1 = require("express-rate-limit");
exports.authRateLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            message: "Too many authentication requests. Please try again in 15 minutes."
        });
    }
});
//# sourceMappingURL=authRateLimit.js.map