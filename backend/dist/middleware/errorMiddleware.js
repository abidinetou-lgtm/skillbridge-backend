"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const httpError_1 = require("../utils/httpError");
const errorMiddleware = (err, _req, res, _next) => {
    // Log the full error for developers, but send clients a generic message.
    console.error(err);
    if (err instanceof httpError_1.HttpError) {
        res.status(err.statusCode).json({
            message: err.message
        });
        return;
    }
    if (err.message === "Email is already registered" ||
        err.message === "Invalid email or password") {
        const statusCode = err.message === "Email is already registered" ? 409 : 401;
        res.status(statusCode).json({
            message: err.message
        });
        return;
    }
    res.status(500).json({
        message: "Internal server error"
    });
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=errorMiddleware.js.map