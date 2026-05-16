import { Prisma, UserStatus } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { prisma } from "../utils/prisma";
import {
  LearningGoalInput,
  SkillInput,
  UpdateProfileInput
} from "../utils/profileValidation";

const skillSelect = {
  id: true,
  name: true,
  description: true,
  category: true
} satisfies Prisma.SkillSelect;

const teachingSkillSelect = {
  id: true,
  description: true,
  yearsOfExperience: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
  skill: {
    select: skillSelect
  }
} satisfies Prisma.UserSkillSelect;

const learningGoalSelect = {
  id: true,
  description: true,
  targetLevel: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  skill: {
    select: skillSelect
  }
} satisfies Prisma.LearningGoalSelect;

const currentUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  bio: true,
  avatarUrl: true,
  role: true,
  status: true,
  rewardKeys: true,
  teachingSkills: {
    select: teachingSkillSelect,
    orderBy: { createdAt: "desc" }
  },
  learningGoals: {
    where: { isActive: true },
    select: learningGoalSelect,
    orderBy: { createdAt: "desc" }
  },
  createdAt: true,
  updatedAt: true
} satisfies Prisma.UserSelect;

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  bio: true,
  avatarUrl: true,
  teachingSkills: {
    select: teachingSkillSelect,
    orderBy: { createdAt: "desc" }
  },
  learningGoals: {
    where: { isActive: true },
    select: learningGoalSelect,
    orderBy: { createdAt: "desc" }
  },
  createdAt: true
} satisfies Prisma.UserSelect;

const ensureActiveUser = async (userId: string): Promise<void> => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      status: UserStatus.ACTIVE
    },
    select: { id: true }
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }
};

const getOrCreateSkill = async (input: SkillInput | LearningGoalInput) => {
  if (input.skillId) {
    const skill = await prisma.skill.findFirst({
      where: {
        id: input.skillId,
        isActive: true
      }
    });

    if (!skill) {
      throw new HttpError(404, "Skill not found");
    }

    return skill;
  }

  if (!input.name) {
    throw new HttpError(400, "skillId or name is required");
  }

  // Upsert lets clients add a new skill name or reuse an existing one with one call.
  const skill = await prisma.skill.upsert({
    where: { name: input.name },
    update: {},
    create: {
      name: input.name,
      description: input.description ?? undefined,
      category: "category" in input ? input.category ?? undefined : undefined
    }
  });

  if (!skill.isActive) {
    throw new HttpError(404, "Skill not found");
  }

  return skill;
};

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      status: UserStatus.ACTIVE
    },
    select: currentUserSelect
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return user;
};

export const updateUserProfile = async (userId: string, input: UpdateProfileInput) => {
  await ensureActiveUser(userId);

  const data: Prisma.UserUpdateInput = {};

  if (input.firstName !== undefined) {
    data.firstName = input.firstName;
  }

  if (input.lastName !== undefined) {
    data.lastName = input.lastName;
  }

  if (input.bio !== undefined) {
    data.bio = input.bio;
  }

  if (input.avatarUrl !== undefined) {
    data.avatarUrl = input.avatarUrl;
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: currentUserSelect
  });
};

export const updateUserAvatar = async (userId: string, avatarUrl: string | null) =>
  updateUserProfile(userId, { avatarUrl });

export const addUserSkill = async (userId: string, input: SkillInput) => {
  await ensureActiveUser(userId);

  const skill = await getOrCreateSkill(input);

  const userSkill = await prisma.userSkill.upsert({
    where: {
      userId_skillId: {
        userId,
        skillId: skill.id
      }
    },
    update: {
      description: input.description,
      yearsOfExperience: input.yearsOfExperience
    },
    create: {
      userId,
      skillId: skill.id,
      description: input.description,
      yearsOfExperience: input.yearsOfExperience
    },
    select: teachingSkillSelect
  });

  return userSkill;
};

export const removeUserSkill = async (userId: string, userSkillId: string) => {
  const userSkill = await prisma.userSkill.findFirst({
    where: {
      id: userSkillId,
      userId
    },
    select: { id: true }
  });

  if (!userSkill) {
    throw new HttpError(404, "User skill not found");
  }

  // Deleting the join row removes only this user's skill, not the global Skill record.
  await prisma.userSkill.delete({
    where: { id: userSkillId }
  });
};

export const addLearningGoal = async (userId: string, input: LearningGoalInput) => {
  await ensureActiveUser(userId);

  const skill = await getOrCreateSkill(input);

  const learningGoal = await prisma.learningGoal.upsert({
    where: {
      userId_skillId: {
        userId,
        skillId: skill.id
      }
    },
    update: {
      description: input.description,
      targetLevel: input.targetLevel,
      isActive: true
    },
    create: {
      userId,
      skillId: skill.id,
      description: input.description,
      targetLevel: input.targetLevel
    },
    select: learningGoalSelect
  });

  return learningGoal;
};

export const removeLearningGoal = async (userId: string, learningGoalId: string) => {
  const learningGoal = await prisma.learningGoal.findFirst({
    where: {
      id: learningGoalId,
      userId
    },
    select: { id: true }
  });

  if (!learningGoal) {
    throw new HttpError(404, "Learning goal not found");
  }

  await prisma.learningGoal.delete({
    where: { id: learningGoalId }
  });
};

export const searchUsers = async (input: {
  query?: string;
  skill?: string;
  limit?: number;
}) => {
  const query = input.query?.trim();
  const skill = input.skill?.trim();

  if (!query && !skill) {
    throw new HttpError(400, "q or skill query parameter is required");
  }

  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);

  return prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      OR: [
        ...(query
          ? [
              { firstName: { contains: query, mode: "insensitive" as const } },
              { lastName: { contains: query, mode: "insensitive" as const } }
            ]
          : []),
        ...(skill
          ? [
              {
                teachingSkills: {
                  some: {
                    skill: {
                      name: { contains: skill, mode: "insensitive" as const },
                      isActive: true
                    }
                  }
                }
              },
              {
                learningGoals: {
                  some: {
                    isActive: true,
                    skill: {
                      name: { contains: skill, mode: "insensitive" as const },
                      isActive: true
                    }
                  }
                }
              }
            ]
          : [])
      ]
    },
    select: publicUserSelect,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: limit
  });
};
