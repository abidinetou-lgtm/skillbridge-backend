import { Prisma, RewardTransactionType, TeachingSessionStatus } from "@prisma/client";
import { v4 as uuid } from "uuid";
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

const recordRewardTransaction = async (
  transaction: Prisma.TransactionClient,
  userId: string,
  amount: number,
  type: RewardTransactionType,
  description: string
): Promise<void> => {
  if (amount <= 0) {
    return;
  }

  await transaction.rewardTransaction.create({
    data: {
      userId,
      amount,
      type,
      description,
    },
  });
};

const settleSessionCredits = async (
  transaction: Prisma.TransactionClient,
  sessionId: string,
  teacherId: string,
  learnerId: string,
  creditsReserved: number,
  durationSeconds: number,
  teacherJoinedAt: Date | null,
  learnerJoinedAt: Date | null
): Promise<{ teacherCreditsPaid: number; learnerCreditsRefunded: number }> => {
  const safeDurationSeconds = Math.max(0, Math.floor(durationSeconds));
  const intendedTeacherCredits =
    teacherJoinedAt !== null && learnerJoinedAt !== null
      ? Math.min(
          creditsReserved,
          MAX_CREDITS,
          Math.floor(safeDurationSeconds / 60)
        )
      : 0;

  const teacherCreditsPaid = await grantCreditsWithActualAmount(
    transaction,
    teacherId,
    intendedTeacherCredits
  );

  const learnerRefund = Math.max(0, creditsReserved - teacherCreditsPaid);

  const learnerCreditsRefunded = await grantCreditsWithActualAmount(
    transaction,
    learnerId,
    Math.min(learnerRefund, MAX_CREDITS)
  );

  await recordRewardTransaction(
    transaction,
    teacherId,
    teacherCreditsPaid,
    RewardTransactionType.EARNED,
    `Teaching session ${sessionId} settlement`
  );

  await recordRewardTransaction(
    transaction,
    learnerId,
    learnerCreditsRefunded,
    RewardTransactionType.REFUNDED,
    `Teaching session ${sessionId} refund`
  );

  return { teacherCreditsPaid, learnerCreditsRefunded };
};

export const endSessionService = async (
  sessionId: string,
  userId: string,
  durationSeconds: number
) => {
  if (
    !Number.isSafeInteger(durationSeconds) ||
    durationSeconds < 0
  ) {
    throw new HttpError(400, "durationSeconds must be a safe non-negative integer");
  }

  await prisma.$transaction(async (transaction) => {
    const sessions = await transaction.$queryRaw<
      Array<{
        teacherId: string;
        learnerId: string;
        creditsReserved: number;
        teacherJoinedAt: Date | null;
        learnerJoinedAt: Date | null;
        status: TeachingSessionStatus;
        actualEndedAt: Date | null;
      }>
    >(Prisma.sql`
      SELECT
        "teacherId",
        "learnerId",
        "creditsReserved",
        "teacherJoinedAt",
        "learnerJoinedAt",
        "status",
        "actualEndedAt"
      FROM "TeachingSession"
      WHERE "id" = ${sessionId}
      FOR UPDATE
    `);

    const session = sessions[0];

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

    if (
      session.status !== TeachingSessionStatus.ACTIVE ||
      session.actualEndedAt !== null
    ) {
      throw new HttpError(400, "Session is not active");
    }

    const bothParticipantsJoined =
      session.teacherJoinedAt !== null && session.learnerJoinedAt !== null;

    const completionStatus = bothParticipantsJoined
      ? TeachingSessionStatus.COMPLETED
      : TeachingSessionStatus.NO_SHOW;

    const settlement = await settleSessionCredits(
      transaction,
      sessionId,
      session.teacherId,
      session.learnerId,
      session.creditsReserved,
      durationSeconds,
      session.teacherJoinedAt,
      session.learnerJoinedAt
    );

    await transaction.teachingSession.update({
      where: { id: sessionId },
      data: {
        status: completionStatus,
        actualEndedAt: new Date(),
        creditsConsumed: settlement.teacherCreditsPaid,
      },
    });
  });
};

export const joinSessionService = async (
  sessionId: string,
  userId: string
) => {
  return prisma.$transaction(async (transaction) => {
    const sessions = await transaction.$queryRaw<
      Array<{
        teacherId: string;
        learnerId: string;
        status: TeachingSessionStatus;
        jitsiRoomId: string;
        teacherJoinedAt: Date | null;
        learnerJoinedAt: Date | null;
        actualEndedAt: Date | null;
        actualStartedAt: Date | null;
      }>
    >(Prisma.sql`
      SELECT
        "teacherId",
        "learnerId",
        "status",
        "jitsiRoomId",
        "teacherJoinedAt",
        "learnerJoinedAt",
        "actualEndedAt",
        "actualStartedAt"
      FROM "TeachingSession"
      WHERE "id" = ${sessionId}
      FOR UPDATE
    `);

    const session = sessions[0];

    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    if (session.teacherId !== userId && session.learnerId !== userId) {
      throw new HttpError(403, "User is not part of this session");
    }

    if (
      session.status === TeachingSessionStatus.COMPLETED ||
      session.status === TeachingSessionStatus.CANCELLED ||
      session.status === TeachingSessionStatus.NO_SHOW ||
      session.actualEndedAt !== null
    ) {
      throw new HttpError(400, "Session has already ended");
    }

    const now = new Date();
    const isTeacher = session.teacherId === userId;

    const data: {
      status: TeachingSessionStatus;
      actualStartedAt?: Date;
      teacherJoinedAt?: Date;
      learnerJoinedAt?: Date;
    } = {
      status: TeachingSessionStatus.ACTIVE,
    };

    if (session.actualStartedAt === null) {
      data.actualStartedAt = now;
    }

    if (isTeacher) {
      if (session.teacherJoinedAt === null) {
        data.teacherJoinedAt = now;
      }
    } else if (session.learnerJoinedAt === null) {
      data.learnerJoinedAt = now;
    }

    await transaction.teachingSession.update({
      where: { id: sessionId },
      data,
    });

    return session.jitsiRoomId;
  });
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