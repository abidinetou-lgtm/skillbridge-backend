import { Prisma } from "@prisma/client";
import { HttpError } from "../utils/httpError";

export const MAX_CREDITS = 500;

const validateCreditAmount = (amount: number): void => {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new HttpError(400, "Credit amount must be a non-negative integer");
  }
};

export const grantCredits = async (
  transaction: Prisma.TransactionClient,
  userId: string,
  amount: number
): Promise<number> => {
  validateCreditAmount(amount);

  const users = await transaction.$queryRaw<Array<{ credits: number }>>(
    Prisma.sql`
      UPDATE "User"
      SET "credits" = LEAST(${MAX_CREDITS}, "credits" + ${amount})
      WHERE "id" = ${userId}
      RETURNING "credits"
    `
  );

  if (!users[0]) {
    throw new HttpError(404, "User not found");
  }

  return users[0].credits;
};

export const grantCreditsWithActualAmount = async (
  transaction: Prisma.TransactionClient,
  userId: string,
  amount: number
): Promise<number> => {
  validateCreditAmount(amount);

  const users = await transaction.$queryRaw<Array<{ credits: number }>>(
    Prisma.sql`
      SELECT "credits"
      FROM "User"
      WHERE "id" = ${userId}
      FOR UPDATE
    `
  );

  if (!users[0]) {
    throw new HttpError(404, "User not found");
  }

  const currentCredits = users[0].credits;
  const nextCredits = Math.min(MAX_CREDITS, currentCredits + amount);

  if (nextCredits !== currentCredits) {
    await transaction.user.update({
      where: { id: userId },
      data: { credits: nextCredits },
    });
  }

  return nextCredits - currentCredits;
};

export const spendCredits = async (
  transaction: Prisma.TransactionClient,
  userId: string,
  amount: number
): Promise<number> => {
  validateCreditAmount(amount);

  const users = await transaction.$queryRaw<Array<{ credits: number }>>(
    Prisma.sql`
      UPDATE "User"
      SET "credits" = "credits" - ${amount}
      WHERE "id" = ${userId}
        AND "credits" >= ${amount}
      RETURNING "credits"
    `
  );

  if (!users[0]) {
    throw new HttpError(400, "User does not have enough credits");
  }

  return users[0].credits;
};
