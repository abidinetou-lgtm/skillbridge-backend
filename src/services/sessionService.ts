import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";
import { v4 as uuid } from "uuid";
import { grantCredits, spendCredits } from "./creditService";

export const createSessionService = async (
  teacherId: string,
  learnerId: string,
  title: string,
  estimatedDuration: number,
  scheduledAt: Date
) => {
  // Verify the learner exists and has enough credits before touching anything.
  const learner = await prisma.user.findUnique({
    where: { id: learnerId },
    select: { credits: true },
  });

  if (!learner) throw new HttpError(404, "Learner not found");
  if (learner.credits < estimatedDuration) {
    throw new HttpError(400, "Learner does not have enough credits");
  }

  const jitsiRoomId = `skillbridge-${uuid()}`;

  // Debit the learner and create the session atomically so concurrent requests
  // cannot overspend the same balance.
  const session = await prisma.$transaction(async (transaction) => {
    await spendCredits(transaction, learnerId, estimatedDuration);

    return transaction.teachingSession.create({
      data: {
        jitsiRoomId,
        teacherId,
        learnerId,
        title,
        creditsReserved: estimatedDuration,
        startsAt: scheduledAt,
      },
    });
  });

  return session;
};

export const endSessionService = async (
  sessionId: string,
  userId: string,
  durationSeconds: number
) => {
  const session = await prisma.teachingSession.findUnique({
    where: { id: sessionId },
    select: {
      teacherId: true,
      learnerId: true,
      creditsReserved: true,
      actualStartedAt: true,
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

  // Convert real elapsed seconds to credits (1 credit = 1 minute, rounded up).
  // Cap at creditsReserved so the learner is never charged more than agreed.
  const minutesElapsed = Math.ceil(durationSeconds / 60);
  const creditsConsumed = Math.min(minutesElapsed, session.creditsReserved);

  // If the session was shorter than estimated, refund the unused credits to
  // the learner before paying the teacher.
  const creditsRefunded = session.creditsReserved - creditsConsumed;

  await prisma.$transaction(async (transaction) => {
    const completed = await transaction.teachingSession.updateMany({
      where: {
        id: sessionId,
        status: "ACTIVE",
      },
      data: {
        status: "COMPLETED",
        actualEndedAt: new Date(),
        creditsConsumed,
      },
    });

    if (completed.count !== 1) {
      throw new HttpError(400, "Session is not active");
    }

    // Teacher rewards and learner refunds are permanent but cannot exceed the cap.
    await grantCredits(transaction, session.teacherId, creditsConsumed);

    if (creditsRefunded > 0) {
      await grantCredits(transaction, session.learnerId, creditsRefunded);
    }
  });
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

  // Transition from SCHEDULED → ACTIVE on first join.
  if (session.status === "SCHEDULED") {
    await prisma.teachingSession.update({
      where: { id: sessionId },
      data: { status: "ACTIVE", actualStartedAt: new Date() },
    });
  }

  return session.jitsiRoomId;
};
