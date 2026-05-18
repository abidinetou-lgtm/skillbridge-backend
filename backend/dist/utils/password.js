"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = void 0;
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;
const hashPassword = async (password) => {
    // bcrypt adds a unique salt automatically, so the same password hashes differently each time.
    return bcrypt.hash(password, SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, passwordHash) => {
    // Always compare with bcrypt instead of checking plain text passwords.
    return bcrypt.compare(password, passwordHash);
};
exports.comparePassword = comparePassword;
//# sourceMappingURL=password.js.map