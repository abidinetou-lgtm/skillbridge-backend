import { v4 as uuid } from "uuid";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";
import { createNotificationService } from "./notificationsService";

export const createSessionService = async (
  teacherId: string,
  learnerId: string,
  title: string,
  estimatedDuration: number,
  scheduledAt: Date
) => {
  const learner = await prisma.user.findUnique({
    where: { id: learnerId },
    select: { credits: true },
  });
  if (!learner) throw new HttpError(404, "Learner not found");
  if (learner.credits < estimatedDuration) {
    throw new HttpError(400, "Learner does not have enough credits");
  }

  const jitsiRoomId = `skillbridge-${uuid()}`;
  const [, session] = await prisma.$transaction([
    prisma.user.update({
      where: { id: learnerId },
      data: { credits: { decrement: estimatedDuration } },
    }),
    prisma.teachingSession.create({
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

  createNotificationService(
    teacherId,
    "SESSION_BOOKED",
    `Une session "${title}" vient d'être créée.`
  ).catch(() => {});

  return session;
};

export const endSessionService = async (
  sessionId: string,
  userId: string,
  durationSeconds: number
): Promise<{ teacherCreditsPaid: number; learnerCreditsRefunded: number }> => {
  const session = await prisma.teachingSession.findUnique({
    where: { id: sessionId },
    select: {
      teacherId: true,
      learnerId: true,
      creditsReserved: true,
      status: true,
    },
  });

  if (!session) throw new HttpError(404, "Session not found");
  if (session.teacherId !== userId && session.learnerId !== userId) {
    throw new HttpError(403, "User is not part of this session");
  }
  if (session.status !== "ACTIVE") {
    throw new HttpError(400, "Session is not active");
  }

  const minutesElapsed = Math.ceil(durationSeconds / 60);
  const teacherCreditsPaid = Math.min(minutesElapsed, session.creditsReserved);
  const learnerCreditsRefunded = session.creditsReserved - teacherCreditsPaid;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.teacherId },
      data: { credits: { increment: teacherCreditsPaid } },
    }),
    ...(learnerCreditsRefunded > 0
      ? [
          prisma.user.update({
            where: { id: session.learnerId },
            data: { credits: { increment: learnerCreditsRefunded } },
          }),
        ]
      : []),
    prisma.teachingSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        actualEndedAt: new Date(),
        creditsConsumed: teacherCreditsPaid,
      },
    }),
  ]);

  return { teacherCreditsPaid, learnerCreditsRefunded };
};

export const joinSessionService = async (
  sessionId: string,
  userId: string
) => {
  const session = await prisma.teachingSession.findUnique({
    where: { id: sessionId },
    select: {
      teacherId: true,
      learnerId: true,
      status: true,
      jitsiRoomId: true,
    },
  });

  if (!session) throw new HttpError(404, "Session not found");
  if (session.teacherId !== userId && session.learnerId !== userId) {
    throw new HttpError(403, "User is not part of this session");
  }
  if (session.status === "COMPLETED" || session.status === "CANCELLED") {
    throw new HttpError(400, "Session has already ended");
  }
  if (session.status === "SCHEDULED") {
    await prisma.teachingSession.update({
      where: { id: sessionId },
      data: { status: "ACTIVE", actualStartedAt: new Date() },
    });
  }
  return session.jitsiRoomId;
};

export const createGroupSessionService = async (
  teacherId: string,
  learnerIds: string[],
  title: string,
  estimatedDuration: number,
  scheduledAt: Date
) => {
  const learners = await prisma.user.findMany({
    where: { id: { in: learnerIds } },
    select: { id: true, credits: true },
  });
  if (learners.length !== learnerIds.length) {
    throw new HttpError(404, "One or more learners not found");
  }

  const jitsiRoomId = `skillbridge-${uuid()}`;
  return prisma.$transaction(async (tx) => {
    for (const learner of learners) {
      if (learner.credits < estimatedDuration) {
        throw new HttpError(400, "Learner does not have enough credits");
      }
      await tx.user.update({
        where: { id: learner.id },
        data: { credits: { decrement: estimatedDuration } },
      });
    }

    const session = await tx.teachingSession.create({
      data: {
        jitsiRoomId,
        teacherId,
        learnerId: learnerIds[0],
        title,
        startsAt: scheduledAt,
        creditsReserved: estimatedDuration * learnerIds.length,
      },
    });

    await tx.sessionParticipant.createMany({
      data: [
        { sessionId: session.id, userId: teacherId, role: "TEACHER" },
        ...learnerIds.map((id) => ({
          sessionId: session.id,
          userId: id,
          role: "LEARNER" as const,
        })),
      ],
    });

    return session;
  });
};

export const addParticipantSessionService = async (
  sessionId: string,
  requesterId: string,
  userId: string
) => {
  const session = await prisma.teachingSession.findUnique({
    where: { id: sessionId },
    select: { teacherId: true, status: true, creditsReserved: true },
  });
  if (!session) throw new HttpError(404, "Session not found");
  if (session.teacherId !== requesterId) {
    throw new HttpError(403, "Only the teacher can add participants");
  }
  if (session.status !== "SCHEDULED" && session.status !== "ACTIVE") {
    throw new HttpError(400, "Cannot add participants to a completed session");
  }

  const existing = await prisma.sessionParticipant.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  });
  if (existing) throw new HttpError(400, "User is already a participant");

  const learner = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  if (!learner) throw new HttpError(404, "User not found");
  if (learner.credits < session.creditsReserved) {
    throw new HttpError(400, "User does not have enough credits");
  }

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: session.creditsReserved } },
    });
    return tx.sessionParticipant.create({
      data: { sessionId, userId, role: "LEARNER" },
    });
  });
};

export const removeParticipantSessionService = async (
  sessionId: string,
  requesterId: string,
  userId: string
) => {
  const session = await prisma.teachingSession.findUnique({
    where: { id: sessionId },
    select: { teacherId: true, status: true, creditsReserved: true },
  });
  if (!session) throw new HttpError(404, "Session not found");
  if (session.teacherId !== requesterId) {
    throw new HttpError(403, "Only the teacher can remove participants");
  }
  if (session.status !== "SCHEDULED") {
    throw new HttpError(400, "Cannot remove participants from a non-scheduled session");
  }

  const existing = await prisma.sessionParticipant.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  });
  if (!existing) throw new HttpError(404, "User is not a participant");

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: session.creditsReserved } },
    });
    return tx.sessionParticipant.delete({
      where: { sessionId_userId: { sessionId, userId } },
    });
  });
};

export const getParticipantsSessionService = async (
  sessionId: string,
  requesterId: string
) => {
  const session = await prisma.teachingSession.findUnique({
    where: { id: sessionId },
    select: { teacherId: true, status: true },
  });
  if (!session) throw new HttpError(404, "Session not found");

  const participant = await prisma.sessionParticipant.findUnique({
    where: { sessionId_userId: { sessionId, userId: requesterId } },
  });
  if (!participant && session.teacherId !== requesterId) {
    throw new HttpError(403, "You are not a participant of this session");
  }

  return prisma.sessionParticipant.findMany({
    where: { sessionId },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  });
};
