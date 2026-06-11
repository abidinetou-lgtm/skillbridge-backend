"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.resendVerification = exports.verifyEmail = exports.login = exports.register = void 0;
const authService_1 = require("../services/authService");
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const register = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, bio } = req.body;
        // Keep basic validation close to the controller because it protects the HTTP boundary.
        if (!isNonEmptyString(email) ||
            !isNonEmptyString(password) ||
            !isNonEmptyString(firstName) ||
            !isNonEmptyString(lastName)) {
            res.status(400).json({ message: "email, password, firstName, and lastName are required" });
            return;
        }
        if (password.length < 8) {
            res.status(400).json({ message: "Password must be at least 8 characters long" });
            return;
        }
        const result = await (0, authService_1.registerUser)({ email, password, firstName, lastName, bio });
        res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
            res.status(400).json({ message: "email and password are required" });
            return;
        }
        const result = await (0, authService_1.loginUser)({ email, password });
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.query;
        if (!isNonEmptyString(token)) {
            res.status(400).json({ message: "Verification token is required" });
            return;
        }
        const result = await (0, authService_1.verifyUserEmail)(token);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.verifyEmail = verifyEmail;
const resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!isNonEmptyString(email)) {
            res.status(400).json({ message: "email is required" });
            return;
        }
        const result = await (0, authService_1.resendUserVerificationEmail)(email);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.resendVerification = resendVerification;
const me = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }
        const user = await (0, authService_1.getCurrentUser)(req.user.id);
        res.status(200).json({ user });
    }
    catch (error) {
        next(error);
    }
};
exports.me = me;
//# sourceMappingURL=authController.js.map