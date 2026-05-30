"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinSessionService = exports.endSessionService = exports.createSessionService = void 0;
const prisma_1 = require("../utils/prisma");
const httpError_1 = require("../utils/httpError");
const crypto_1 = require("crypto");
const createSessionService = async (teacherId, learnerId, title, estimatedDuration, scheduledAt) => {
    const learner = await prisma_1.prisma.user.findUnique({
        where: { id: learnerId },
        select: { credits: true }
    });
    if (!learner) {
        throw new httpError_1.HttpError(404, "Learner not found");
    }
    if (learner.credits < estimatedDuration) {
        throw new httpError_1.HttpError(400, "Learner does not have enough credits");
    }
    const jitsiRoomId = `skillbridge-${(0, crypto_1.randomUUID)()}`;
    await prisma_1.prisma.user.update({
        where: { id: learnerId },
        data: { credits: { decrement: estimatedDuration } }
    });
    const session = await prisma_1.prisma.teachingSession.create({
        data: {
            jitsiRoomId,
            teacherId,
            learnerId,
            title,
            creditsReserved: estimatedDuration,
            startsAt: scheduledAt
        }
    });
    return session;
};
exports.createSessionService = createSessionService;
const endSessionService = async (sessionId, userId) => {
    const session = await prisma_1.prisma.teachingSession.findUnique({
        where: { id: sessionId },
        select: { teacherId: true, learnerId: true, creditsReserved: true, status: true }
    });
    if (!session) {
        throw new httpError_1.HttpError(404, "Session not found");
    }
    if (session.teacherId !== userId && session.learnerId !== userId) {
        throw new httpError_1.HttpError(403, "User is not part of this session");
    }
    if (session.status !== "ACTIVE") {
        throw new httpError_1.HttpError(400, "Session is not active");
    }
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.user.update({
            where: { id: session.teacherId },
            data: { credits: { increment: session.creditsReserved } }
        }),
        prisma_1.prisma.teachingSession.update({
            where: { id: sessionId },
            data: {
                status: "COMPLETED",
                actualEndedAt: new Date(),
                creditsConsumed: session.creditsReserved
            }
        })
    ]);
};
exports.endSessionService = endSessionService;
const joinSessionService = async (sessionId, userId) => {
    const session = await prisma_1.prisma.teachingSession.findUnique({
        where: { id: sessionId },
        select: { teacherId: true, learnerId: true, status: true, jitsiRoomId: true }
    });
    if (!session) {
        throw new httpError_1.HttpError(404, "Session not found");
    }
    if (session.teacherId !== userId && session.learnerId !== userId) {
        throw new httpError_1.HttpError(403, "User is not part of this session");
    }
    if (session.status !== "SCHEDULED") {
        throw new httpError_1.HttpError(400, "Session is not scheduled");
    }
    await prisma_1.prisma.teachingSession.update({
        where: { id: sessionId },
        data: { status: "ACTIVE", actualStartedAt: new Date() }
    });
    return session.jitsiRoomId;
};
exports.joinSessionService = joinSessionService;
//# sourceMappingURL=sessionService.js.map