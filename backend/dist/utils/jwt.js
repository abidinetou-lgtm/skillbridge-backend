"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jwt = require("jsonwebtoken");
const env_1 = require("./env");
const generateToken = (payload) => {
    const options = {
        expiresIn: env_1.env.jwtExpiresIn
    };
    // The token contains only safe identity data, never the password hash.
    return jwt.sign(payload, env_1.env.jwtSecret, options);
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    // jsonwebtoken throws when the token is expired, malformed, or signed with the wrong secret.
    return jwt.verify(token, env_1.env.jwtSecret);
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=jwt.js.map