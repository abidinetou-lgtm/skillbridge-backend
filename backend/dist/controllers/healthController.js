"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthCheck = void 0;
const getHealthCheck = (_req, res) => {
    // Health checks help load balancers and uptime monitors confirm the API is alive.
    res.status(200).json({
        status: "ok",
        message: "API is healthy"
    });
};
exports.getHealthCheck = getHealthCheck;
//# sourceMappingURL=healthController.js.map