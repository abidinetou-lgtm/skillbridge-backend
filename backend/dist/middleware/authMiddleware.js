"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ message: "Authorization token is required" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        // Store the verified identity on the request for controllers that need the current user.
        req.user = {
            id: payload.userId,
            role: payload.role
        };
        next();
    }
    catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.authenticate = authenticate;
const authorizeRoles = (...roles) => (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }
    if (!roles.includes(req.user.role)) {
        res.status(403).json({ message: "You do not have permission to access this resource" });
        return;
    }
    next();
};
exports.authorizeRoles = authorizeRoles;
//# sourceMappingURL=authMiddleware.js.map