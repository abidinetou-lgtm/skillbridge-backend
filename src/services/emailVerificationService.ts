import crypto = require("crypto");
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";
import { buildVerificationUrl, sendVerificationEmail } from "./emailService";

const VERIFICATION_TOKEN_BYTES = 32;
const VERIFICATION_TOKEN_EXPIRES_IN_HOURS = 24;

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const createRawToken = (): string =>
  crypto.randomBytes(VERIFICATION_TOKEN_BYTES).toString("hex");

export const createEmailVerificationToken = async (userId: string): Promise<string> => {
  const token = createRawToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRES_IN_HOURS * 60 * 60 * 1000);
  const now = new Date();

  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({
      where: {
        userId,
        usedAt: null
      },
      data: {
        usedAt: now
      }
    }),
    prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    })
  ]);

  return token;
};

export const sendUserVerificationEmail = async (user: {
  id: string;
  email: string;
  firstName: string;
}): Promise<void> => {
  const token = await createEmailVerificationToken(user.id);
  const verificationUrl = buildVerificationUrl(token);

  await sendVerificationEmail({
    to: user.email,
    firstName: user.firstName,
    verificationUrl,
    expiresInHours: VERIFICATION_TOKEN_EXPIRES_IN_HOURS
  });
};

export const verifyEmailToken = async (token: string) => {
  const tokenHash = hashToken(token);
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!verificationToken) {
    throw new HttpError(400, "Invalid or expired verification token");
  }

  if (verificationToken.usedAt) {
    throw new HttpError(400, "Verification token has already been used");
  }

  if (verificationToken.expiresAt <= new Date()) {
    throw new HttpError(400, "Invalid or expired verification token");
  }

  const now = new Date();
  const user = await prisma.$transaction(async (tx) => {
    const updateResult = await tx.emailVerificationToken.updateMany({
      where: {
        id: verificationToken.id,
        usedAt: null,
        expiresAt: { gt: now }
      },
      data: { usedAt: now }
    });

    if (updateResult.count !== 1) {
      throw new HttpError(400, "Invalid or expired verification token");
    }

    return tx.user.update({
      where: { id: verificationToken.userId },
      data: { isEmailVerified: true }
    });
  });

  return user;
};

export const resendEmailVerification = async (email: string): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user || user.isEmailVerified) {
    return;
  }

  await sendUserVerificationEmail(user);
};
