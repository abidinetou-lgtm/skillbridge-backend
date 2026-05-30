"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.loginUser = exports.registerUser = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../utils/prisma");
const jwt_1 = require("../utils/jwt");
const httpError_1 = require("../utils/httpError");
const password_1 = require("../utils/password");
const sanitizeUser = (user) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio,
    role: user.role,
    status: user.status,
    credits: user.credits,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
const registerUser = async (input) => {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { email: normalizedEmail },
    });
    if (existingUser) {
        throw new httpError_1.HttpError(409, "Email is already registered");
    }
    const passwordHash = await (0, password_1.hashPassword)(input.password);
    const user = await prisma_1.prisma.user.create({
        data: {
            email: normalizedEmail,
            passwordHash,
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            bio: input.bio?.trim(),
            role: client_1.Role.USER,
        },
    });
    const token = (0, jwt_1.generateToken)({ userId: user.id, role: user.role });
    return { user: sanitizeUser(user), token };
};
exports.registerUser = registerUser;
const loginUser = async (input) => {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: normalizedEmail },
    });
    if (!user || user.status !== client_1.UserStatus.ACTIVE) {
        throw new httpError_1.HttpError(401, "Invalid email or password");
    }
    const isPasswordValid = await (0, password_1.comparePassword)(input.password, user.passwordHash);
    if (!isPasswordValid) {
        throw new httpError_1.HttpError(401, "Invalid email or password");
    }
    const token = (0, jwt_1.generateToken)({ userId: user.id, role: user.role });
    return { user: sanitizeUser(user), token };
};
exports.loginUser = loginUser;
const getCurrentUser = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user || user.status !== client_1.UserStatus.ACTIVE) {
        throw new httpError_1.HttpError(404, "User not found");
    }
    return sanitizeUser(user);
};
exports.getCurrentUser = getCurrentUser;
//# sourceMappingURL=authService.js.map