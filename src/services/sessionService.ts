import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";
import { v4 as uuid } from "uuid";
import { grantCredits, spendCredits } from "./creditService";
import { Prisma } from "@prisma/client";

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
  const session = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
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

  await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
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

export const createGroupSessionService = async (
  teacherId: string,
  learnerIds: string[],
  title: string,
  estimatedDuration: number,
  scheduledAt: Date
) => {
  // Verify all learners exist and have enough credits before touching anything.
  const learners = await prisma.user.findMany({
    where: { id: { in: learnerIds } },
    select: { id: true, credits: true },
  });
  if (learners.length !== learnerIds.length) {
        throw new HttpError(404, "One or more learners not found");
  }
  const jitsiRoomId = `skillbridge-${uuid()}`;
  return await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
  
  // a — vérifier et débiter chaque learner
  for (const learner of learners) {
    if (learner.credits < estimatedDuration) {
      throw new HttpError(400, "Learner does not have enough credits");
    }
    await spendCredits(transaction, learner.id, estimatedDuration);
  }

  // b — créer la session UNE SEULE FOIS
  const session = await transaction.teachingSession.create({
    data: {
      jitsiRoomId,
      teacherId,
      learnerId: learnerIds[0],
      title,
      startsAt: scheduledAt,
      creditsReserved: estimatedDuration * learnerIds.length,
    }
  });

  // c — créer les participants avec session.id qui existe maintenant
  await transaction.sessionParticipant.createMany({
    data: [
      { sessionId: session.id, userId: teacherId, role: "TEACHER" },
      ...learnerIds.map(id => ({ sessionId: session.id, userId: id, role: "LEARNER" }))
    ]
  });

  return session;
});
};

export const addParticipantSessionService = async (
  sessionId: string,
  requesterId: string,
  userId: string,
) => {
  const session = await prisma.teachingSession.findUnique({
    where: { id: sessionId },
    select: { teacherId: true, status: true, creditsReserved: true }
  });

  if (!session) {
    throw new HttpError(404, "Session not found");
  }

  if (session.teacherId !== requesterId) {
    throw new HttpError(403, "Only the teacher can add participants");
  }

  if (session.status !== "SCHEDULED" && session.status !== "ACTIVE") {
    throw new HttpError(400, "Cannot add participants to an inactive or completed session");
  }
  // Check if the user is already a participant
  const existingParticipant = await prisma.sessionParticipant.findUnique({
    where: { sessionId_userId: { sessionId, userId } }
  });

  if (existingParticipant) {
    throw new HttpError(400, "User is already a participant");
  }
  const learner = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  if (!learner) {
    throw new HttpError(404, "User not found");
  }
  if (learner.credits < session.creditsReserved) {
    throw new HttpError(400, "User does not have enough credits");
  }
  return await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    await spendCredits(transaction, userId, session.creditsReserved);
      return await transaction.sessionParticipant.create({
      data: { sessionId, userId, role: "LEARNER" }
  })
  })
};

export const removeParticipantSessionService = async (
  sessionId: string,
  requesterId: string,
  userId: string,
) => {
  const session = await prisma.teachingSession.findUnique({
    where: { id: sessionId },
    select: { teacherId: true, status: true, creditsReserved: true }
  });

  if (!session) {
    throw new HttpError(404, "Session not found");
  }

  if (session.teacherId !== requesterId) {
    throw new HttpError(403, "Only the teacher can remove participants");
  }

  if (session.status !== "SCHEDULED") {
    throw new HttpError(400, "Cannot remove participants from an inactive or completed session");
  }
  // Check if the user is already a participant
  const existingParticipant = await prisma.sessionParticipant.findUnique({
    where: { sessionId_userId: { sessionId, userId } }
  });

  if (!existingParticipant) {
    throw new HttpError(404, "User is not a participant");
  }

  return await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    await grantCredits(transaction, userId, session.creditsReserved);
      return await transaction.sessionParticipant.delete({
      where: { sessionId_userId: { sessionId, userId } }
  });
  });
};

export const getParticipantsSessionService = async (sessionId: string, requesterId: string) => {
  const session = await prisma.teachingSession.findUnique({
    where: { id: sessionId },
    select: { teacherId: true, status: true }
  });

  if (!session) {
    throw new HttpError(404, "Session not found");
  }

  const requesterParticipant = await prisma.sessionParticipant.findUnique({
  where: { sessionId_userId: { sessionId, userId: requesterId } }
  });

  if (!requesterParticipant) {
    throw new HttpError(403, "You are not a participant of this session");
  }
  
  const participants = await prisma.sessionParticipant.findMany({
    where: { sessionId },
    include: {
    user: {
    select: { firstName: true, lastName: true, avatarUrl: true }
  }}
  });

  return participants;
};