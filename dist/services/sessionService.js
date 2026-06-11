"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinSessionService = exports.endSessionService = exports.createSessionService = void 0;
const prisma_1 = require("../utils/prisma");
const httpError_1 = require("../utils/httpError");
const uuid_1 = require("uuid");
const createSessionService = async (teacherId, learnerId, title, estimatedDuration, scheduledAt) => {
    // Verify the learner exists and has enough credits before touching anything.
    const learner = await prisma_1.prisma.user.findUnique({
        where: { id: learnerId },
        select: { credits: true },
    });
    if (!learner)
        throw new httpError_1.HttpError(404, "Learner not found");
    if (learner.credits < estimatedDuration) {
        throw new httpError_1.HttpError(400, "Learner does not have enough credits");
    }
    const jitsiRoomId = `skillbridge-${(0, uuid_1.v4)()}`;
    // Debit the learner and create the session atomically so a partial failure
    // cannot leave the learner's balance decremented without a matching session.
    const [, session] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.user.update({
            where: { id: learnerId },
            data: { credits: { decrement: estimatedDuration } },
        }),
        prisma_1.prisma.teachingSession.create({
            data: {
                jitsiRoomId,
                teacherId,
                learnerId,
                title,
                creditsReserved: estimatedDuration,
                startsAt: scheduledAt,
            },
        }),
    ]);
    return session;
};
exports.createSessionService = createSessionService;
const endSessionService = async (sessionId, userId, durationSeconds) => {
    const session = await prisma_1.prisma.teachingSession.findUnique({
        where: { id: sessionId },
        select: {
            teacherId: true,
            learnerId: true,
            creditsReserved: true,
            actualStartedAt: true,
            status: true,
        },
    });
    if (!session)
        throw new httpError_1.HttpError(404, "Session not found");
    if (session.teacherId !== userId && session.learnerId !== userId) {
        throw new httpError_1.HttpError(403, "User is not part of this session");
    }
    if (session.status !== "ACTIVE") {
        throw new httpError_1.HttpError(400, "Session is not active");
    }
    // Convert real elapsed seconds to credits (1 credit = 1 minute, rounded up).
    // Cap at creditsReserved so the learner is never charged more than agreed.
    const minutesElapsed = Math.ceil(durationSeconds / 60);
    const creditsConsumed = Math.min(minutesElapsed, session.creditsReserved);
    // If the session was shorter than estimated, refund the unused credits to
    // the learner before paying the teacher.
    const creditsRefunded = session.creditsReserved - creditsConsumed;
    await prisma_1.prisma.$transaction([
        // Pay the teacher for the actual time spent.
        prisma_1.prisma.user.update({
            where: { id: session.teacherId },
            data: { credits: { increment: creditsConsumed } },
        }),
        // Refund unused reserved credits to the learner (no-op when consumed === reserved).
        ...(creditsRefunded > 0
            ? [
                prisma_1.prisma.user.update({
                    where: { id: session.learnerId },
                    data: { credits: { increment: creditsRefunded } },
                }),
            ]
            : []),
        prisma_1.prisma.teachingSession.update({
            where: { id: sessionId },
            data: {
                status: "COMPLETED",
                actualEndedAt: new Date(),
                creditsConsumed,
            },
        }),
    ]);
};
exports.endSessionService = endSessionService;
const joinSessionService = async (sessionId, userId) => {
    const session = await prisma_1.prisma.teachingSession.findUnique({
        where: { id: sessionId },
        select: {
            teacherId: true,
            learnerId: true,
            status: true,
            jitsiRoomId: true,
        },
    });
    if (!session)
        throw new httpError_1.HttpError(404, "Session not found");
    if (session.teacherId !== userId && session.learnerId !== userId) {
        throw new httpError_1.HttpError(403, "User is not part of this session");
    }
    if (session.status === "COMPLETED" || session.status === "CANCELLED") {
        throw new httpError_1.HttpError(400, "Session has already ended");
    }
    // Transition from SCHEDULED → ACTIVE on first join.
    if (session.status === "SCHEDULED") {
        await prisma_1.prisma.teachingSession.update({
            where: { id: sessionId },
            data: { status: "ACTIVE", actualStartedAt: new Date() },
        });
    }
    return session.jitsiRoomId;
};
exports.joinSessionService = joinSessionService;
//# sourceMappingURL=sessionService.js.map