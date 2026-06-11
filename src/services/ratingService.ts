import { Prisma, TeachingSessionStatus } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { prisma } from "../utils/prisma";

interface CreateSessionRatingInput {
  sessionId: string;
  reviewerId: string;
  reviewedUserId: string;
  rating: number;
  comment?: string | null;
}

const ratingSelect = {
  id: true,
  sessionId: true,
  reviewerId: true,
  reviewedUserId: true,
  rating: true,
  comment: true,
  createdAt: true,
  reviewer: {
    select: {
      id: true,
      firstName: true,
      lastName: true
    }
  },
  reviewedUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true
    }
  },
  session: {
    select: {
      id: true,
      title: true,
      startsAt: true,
      actualEndedAt: true
    }
  }
} satisfies Prisma.SessionRatingSelect;

const normalizeComment = (comment: string | null | undefined): string | null => {
  if (comment === undefined || comment === null) {
    return null;
  }

  const trimmed = comment.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const updateUserRatingStats = async (
  transaction: Prisma.TransactionClient,
  userId: string
): Promise<void> => {
  await transaction.$queryRaw(
    Prisma.sql`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`
  );

  const aggregate = await transaction.sessionRating.aggregate({
    where: { reviewedUserId: userId },
    _avg: { rating: true },
    _count: { rating: true }
  });

  await transaction.user.update({
    where: { id: userId },
    data: {
      averageRating: aggregate._avg.rating ?? 0,
      totalRatings: aggregate._count.rating
    }
  });
};

export const createSessionRating = async ({
  sessionId,
  reviewerId,
  reviewedUserId,
  rating,
  comment
}: CreateSessionRatingInput) => {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, "rating must be an integer between 1 and 5");
  }

  if (!reviewedUserId.trim()) {
    throw new HttpError(400, "reviewedUserId is required");
  }

  if (reviewerId === reviewedUserId) {
    throw new HttpError(400, "Users cannot rate themselves");
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const session = await transaction.teachingSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          teacherId: true,
          learnerId: true,
          status: true
        }
      });

      if (!session) {
        throw new HttpError(404, "Session not found");
      }

      if (session.status !== TeachingSessionStatus.COMPLETED) {
        throw new HttpError(400, "Only completed sessions can be rated");
      }

      const participantIds = [session.teacherId, session.learnerId];

      if (!participantIds.includes(reviewerId)) {
        throw new HttpError(403, "Only session participants can submit ratings");
      }

      if (!participantIds.includes(reviewedUserId)) {
        throw new HttpError(400, "Reviewed user must be a session participant");
      }

      const created = await transaction.sessionRating.create({
        data: {
          sessionId,
          reviewerId,
          reviewedUserId,
          rating,
          comment: normalizeComment(comment)
        },
        select: ratingSelect
      });

      await updateUserRatingStats(transaction, reviewedUserId);

      return created;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "User has already rated this participant for this session");
    }

    throw error;
  }
};

export const getUserRatings = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      averageRating: true,
      totalRatings: true
    }
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const ratings = await prisma.sessionRating.findMany({
    where: { reviewedUserId: userId },
    select: ratingSelect,
    orderBy: { createdAt: "desc" }
  });

  return {
    averageRating: user.averageRating,
    totalRatings: user.totalRatings,
    ratings
  };
};

export const getUserRatingSummary = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      averageRating: true,
      totalRatings: true
    }
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return user;
};
