import { Prisma, RewardTransactionType, TeachingSessionStatus } from "@prisma/client";
import { v4 as uuid } from "uuid";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";
import {
  MAX_CREDITS,
  grantCreditsWithActualAmount,
  spendCredits,
} from "./creditService";

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

    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    if (session.teacherId !== userId && session.learnerId !== userId) {
      throw new HttpError(403, "User is not part of this session");
    }

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
