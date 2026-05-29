import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";
import { randomUUID } from "crypto";
import { TeachingSessionStatus } from "@prisma/client";

export const createSessionService = async (teacherId: string, learnerId: string, title: string, estimatedDuration: number, scheduledAt: Date) => {
   const learner = await prisma.user.findUnique({
        where: { id: learnerId },
        select: { credits: true }
    });
    if (!learner) {
        throw new HttpError(404, "Learner not found");
    }
    if (learner.credits < estimatedDuration) {
        throw new HttpError(400, "Learner does not have enough credits");
    }
    const jitsiRoomId = `skillbridge-${randomUUID()}`;
    await prisma.user.update({
        where: { id: learnerId },
        data: { credits: { decrement: estimatedDuration } } });
    const session = await prisma.teachingSession.create({
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

export const endSessionService = async (sessionId: string, userId: string) => {
    const session = await prisma.teachingSession.findUnique({
        where: { id: sessionId },
        select: { teacherId: true, learnerId: true, creditsReserved: true, status: true }
    })
    if (!session) {
        throw new HttpError(404, "Session not found");
    }
    if (session.teacherId !== userId && session.learnerId !== userId) {
        throw new HttpError(403, "User is not part of this session");
    }
    if (session.status !== "ACTIVE"  ) {
        throw new HttpError(400, "Session is not active");
    }
    await prisma.$transaction([
    prisma.user.update({
        where: { id: session.teacherId },
        data: { credits: { increment: session.creditsReserved } }
    }),
    prisma.teachingSession.update({
        where: { id: sessionId },
        data: {
            status: "COMPLETED",
            actualEndedAt: new Date(),
            creditsConsumed: session.creditsReserved
            }
        })
    ]);
};

export const joinSessionService = async (sessionId: string, userId: string) => {
    const session = await prisma.teachingSession.findUnique({
        where: { id: sessionId },
        select: { teacherId: true, learnerId: true, status: true, jitsiRoomId: true }
    });
    if (!session) {
        throw new HttpError(404, "Session not found");
    }
    if (session.teacherId !== userId && session.learnerId !== userId) {
        throw new HttpError(403, "User is not part of this session");
    }
    if (session.status !== "SCHEDULED") {
        throw new HttpError(400, "Session is not scheduled");
    }
    await prisma.teachingSession.update({
        where: { id: sessionId },
        data: { status: "ACTIVE", actualStartedAt: new Date() }
    });
    return session.jitsiRoomId;
};
