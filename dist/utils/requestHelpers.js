"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthenticatedUserId = void 0;
const httpError_1 = require("./httpError");
/**
 * Extracts the authenticated user's ID from the request.
 * Throws 401 if the middleware did not attach a user (should never happen
 * when the route is protected by `authenticate`, but guards against misuse).
 */
const getAuthenticatedUserId = (req) => {
    if (!req.user)
        throw new httpError_1.HttpError(401, "Authentication required");
    return req.user.id;
};
exports.getAuthenticatedUserId = getAuthenticatedUserId;
//# sourceMappingURL=requestHelpers.js.map