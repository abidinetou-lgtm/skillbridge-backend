import { Role, UserStatus } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { generateToken } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";

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
  rewardKeys: number;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  bio: user.bio,
  role: user.role,
  status: user.status,
  rewardKeys: user.rewardKeys,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const registerUser = async (input: RegisterInput) => {
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      bio: input.bio?.trim(),
      role: Role.USER
    }
  });

  const token = generateToken({ userId: user.id, role: user.role });

  return {
    user: sanitizeUser(user),
    token
  };
};

export const loginUser = async (input: LoginInput) => {
  const normalizedEmail = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await comparePassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({ userId: user.id, role: user.role });

  return {
    user: sanitizeUser(user),
    token
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new Error("User not found");
  }

  return sanitizeUser(user);
};
