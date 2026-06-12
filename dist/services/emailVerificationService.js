"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendEmailVerification = exports.verifyEmailToken = exports.sendUserVerificationEmail = exports.createEmailVerificationToken = void 0;
const crypto = require("crypto");
const prisma_1 = require("../utils/prisma");
const httpError_1 = require("../utils/httpError");
const emailService_1 = require("./emailService");
const VERIFICATION_TOKEN_BYTES = 32;
const VERIFICATION_TOKEN_EXPIRES_IN_HOURS = 24;
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const createRawToken = () => crypto.randomBytes(VERIFICATION_TOKEN_BYTES).toString("hex");
const createEmailVerificationToken = async (userId) => {
    const token = createRawToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRES_IN_HOURS * 60 * 60 * 1000);
    const now = new Date();
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.emailVerificationToken.updateMany({
            where: {
                userId,
                usedAt: null
            },
            data: {
                usedAt: now
            }
        }),
        prisma_1.prisma.emailVerificationToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt
            }
        })
    ]);
    return token;
};
exports.createEmailVerificationToken = createEmailVerificationToken;
const sendUserVerificationEmail = async (user) => {
    const token = await (0, exports.createEmailVerificationToken)(user.id);
    const verificationUrl = (0, emailService_1.buildVerificationUrl)(token);
    await (0, emailService_1.sendVerificationEmail)({
        to: user.email,
        firstName: user.firstName,
        verificationUrl,
        expiresInHours: VERIFICATION_TOKEN_EXPIRES_IN_HOURS
    });
};
exports.sendUserVerificationEmail = sendUserVerificationEmail;
const verifyEmailToken = async (token) => {
    const tokenHash = hashToken(token);
    const verificationToken = await prisma_1.prisma.emailVerificationToken.findUnique({
        where: { tokenHash },
        include: { user: true }
    });
    if (!verificationToken) {
        throw new httpError_1.HttpError(400, "Invalid or expired verification token");
    }
    if (verificationToken.usedAt) {
        throw new httpError_1.HttpError(400, "Verification token has already been used");
    }
    if (verificationToken.expiresAt <= new Date()) {
        throw new httpError_1.HttpError(400, "Invalid or expired verification token");
    }
    const now = new Date();
    const user = await prisma_1.prisma.$transaction(async (tx) => {
        const updateResult = await tx.emailVerificationToken.updateMany({
            where: {
                id: verificationToken.id,
                usedAt: null,
                expiresAt: { gt: now }
            },
            data: { usedAt: now }
        });
        if (updateResult.count !== 1) {
            throw new httpError_1.HttpError(400, "Invalid or expired verification token");
        }
        return tx.user.update({
            where: { id: verificationToken.userId },
            data: { isEmailVerified: true }
        });
    });
    return user;
};
exports.verifyEmailToken = verifyEmailToken;
const resendEmailVerification = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: normalizedEmail }
    });
    if (!user || user.isEmailVerified) {
        return;
    }
    await (0, exports.sendUserVerificationEmail)(user);
};
exports.resendEmailVerification = resendEmailVerification;
//# sourceMappingURL=emailVerificationService.js.map