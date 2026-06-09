import { createHash, randomBytes } from "crypto";
import { Role, UserStatus } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { generateToken } from "../utils/jwt";
import { HttpError } from "../utils/httpError";
import { comparePassword, hashPassword } from "../utils/password";
import { env } from "../utils/env";
import { sendPasswordResetEmail } from "./emailService";

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  bio?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const INVALID_RESET_TOKEN_MESSAGE = "Invalid or expired password reset token";

const hashResetToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const sanitizeUser = (user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  role: Role;
  status: UserStatus;
  credits: number;
  averageRating: number;
  totalRatings: number;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id:        user.id,
  email:     user.email,
  firstName: user.firstName,
  lastName:  user.lastName,
  bio:       user.bio,
  role:      user.role,
  status:    user.status,
  credits:   user.credits,
  averageRating: user.averageRating,
  totalRatings:  user.totalRatings,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const registerUser = async (input: RegisterInput) => {
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new HttpError(409, "Email is already registered");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email:        normalizedEmail,
      passwordHash,
      firstName:    input.firstName.trim(),
      lastName:     input.lastName.trim(),
      bio:          input.bio?.trim(),
      role:         Role.USER,
    },
  });

  const token = generateToken({ userId: user.id, role: user.role });
  return { user: sanitizeUser(user), token };
};

export const loginUser = async (input: LoginInput) => {
  const normalizedEmail = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new HttpError(401, "Invalid email or password");
  }

  const isPasswordValid = await comparePassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = generateToken({ userId: user.id, role: user.role });
  return { user: sanitizeUser(user), token };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new HttpError(404, "User not found");
  }

  return sanitizeUser(user);
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      status: true
    }
  });

  if (!user || user.status !== UserStatus.ACTIVE) {
    return;
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null
      },
      data: { usedAt: now }
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    })
  ]);

  const resetUrl = new URL(env.passwordResetUrl);
  resetUrl.searchParams.set("token", token);

  try {
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl: resetUrl.toString()
    });
  } catch (error) {
    console.error("Failed to send password reset email", error);
  }
};

export const resetPassword = async (
  token: string,
  password: string
): Promise<void> => {
  const tokenHash = hashResetToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true
    }
  });
  const now = new Date();

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt.getTime() <= now.getTime()
  ) {
    throw new HttpError(400, INVALID_RESET_TOKEN_MESSAGE);
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.passwordResetToken.updateMany({
      where: {
        id: resetToken.id,
        usedAt: null,
        expiresAt: { gt: now }
      },
      data: { usedAt: now }
    });

    if (consumed.count !== 1) {
      throw new HttpError(400, INVALID_RESET_TOKEN_MESSAGE);
    }

    await transaction.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    });

    await transaction.passwordResetToken.updateMany({
      where: {
        userId: resetToken.userId,
        usedAt: null
      },
      data: { usedAt: now }
    });
  });
};
