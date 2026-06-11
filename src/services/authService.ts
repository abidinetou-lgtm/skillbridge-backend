import { Role, UserStatus } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { generateToken } from "../utils/jwt";
import { HttpError } from "../utils/httpError";
import { comparePassword, hashPassword } from "../utils/password";
import { resendEmailVerification, sendUserVerificationEmail, verifyEmailToken } from "./emailVerificationService";

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

const sanitizeUser = (user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  role: Role;
  status: UserStatus;
  isEmailVerified: boolean;
  credits: number;
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
  isEmailVerified: user.isEmailVerified,
  credits:   user.credits,
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
      isEmailVerified: false,
    },
  });

  await sendUserVerificationEmail(user);

  return {
    user: sanitizeUser(user),
    message: "Registration successful. Please verify your email address before signing in."
  };
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

  if (!user.isEmailVerified) {
    throw new HttpError(403, "Please verify your email address before signing in.");
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

  if (!user.isEmailVerified) {
    throw new HttpError(403, "Please verify your email address before signing in.");
  }

  return sanitizeUser(user);
};

export const verifyUserEmail = async (token: string) => {
  const user = await verifyEmailToken(token);

  return {
    user: sanitizeUser(user),
    message: "Email address verified successfully."
  };
};

export const resendUserVerificationEmail = async (email: string) => {
  await resendEmailVerification(email);

  return {
    message: "If an unverified account exists for this email, a new verification link has been sent."
  };
};
