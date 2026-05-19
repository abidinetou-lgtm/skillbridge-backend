import { MatchStatus, Prisma, UserStatus } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { prisma } from "../utils/prisma";

export type CreateMatchRequestInput = {
  receiverId: string;
  skillId?: string;
  message?: string;
};

export type UpdateMatchStatusInput = {
  status: (typeof MatchStatus)["ACCEPTED"] | (typeof MatchStatus)["REJECTED"];
};

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  bio: true
} satisfies Prisma.UserSelect;

const matchSelect = {
  id: true,
  requesterId: true,
  receiverId: true,
  skillId: true,
  status: true,
  message: true,
  requester: {
    select: publicUserSelect
  },
  receiver: {
    select: publicUserSelect
  },
  skill: {
    select: {
      id: true,
      name: true,
      description: true,
      category: true
    }
  },
  createdAt: true,
  updatedAt: true
} satisfies Prisma.MatchSelect;

const suggestionSelect = {
  id: true,
  firstName: true,
  lastName: true,
  bio: true,
  teachingSkills: {
    where: {
      skill: {
        isActive: true
      }
    },
    select: {
      id: true,
      description: true,
      yearsOfExperience: true,
      isVerified: true,
      skill: {
        select: {
          id: true,
          name: true,
          description: true,
          category: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  }
} satisfies Prisma.UserSelect;

const ensureActiveUser = async (userId: string, message = "User not found"): Promise<void> => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      status: UserStatus.ACTIVE
    },
    select: { id: true }
  });

  if (!user) {
    throw new HttpError(404, message);
  }
};

const ensureActiveSkill = async (skillId: string): Promise<void> => {
  const skill = await prisma.skill.findFirst({
    where: {
      id: skillId,
      isActive: true
    },
    select: { id: true }
  });

  if (!skill) {
    throw new HttpError(404, "Skill not found");
  }
};

export const sendMatchRequest = async (
  requesterId: string,
  input: CreateMatchRequestInput
) => {
  if (requesterId === input.receiverId) {
    throw new HttpError(400, "You cannot request a match with yourself");
  }

  const skillId = input.skillId ?? null;

  await ensureActiveUser(requesterId, "Requester not found");
  await ensureActiveUser(input.receiverId, "Receiver not found");

  if (skillId) {
    await ensureActiveSkill(skillId);
  }

  // Pending requests are unique per user pair and skill, regardless of who sent first.
  const existingPendingMatch = await prisma.match.findFirst({
    where: {
      status: MatchStatus.PENDING,
      skillId,
      OR: [
        {
          requesterId,
          receiverId: input.receiverId
        },
        {
          requesterId: input.receiverId,
          receiverId: requesterId
        }
      ]
    },
    select: { id: true }
  });

  if (existingPendingMatch) {
    throw new HttpError(409, "A pending match request already exists");
  }

  try {
    return await prisma.match.create({
      data: {
        requesterId,
        receiverId: input.receiverId,
        skillId,
        message: input.message
      },
      select: matchSelect
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new HttpError(409, "A match already exists for these users and skill");
    }

    throw error;
  }
};

export const listMyMatches = async (userId: string) => {
  await ensureActiveUser(userId);

  return prisma.match.findMany({
    where: {
      OR: [
        { requesterId: userId },
        { receiverId: userId }
      ]
    },
    select: matchSelect,
    orderBy: { updatedAt: "desc" }
  });
};

export const listMatchSuggestions = async (userId: string) => {
  await ensureActiveUser(userId);

  const learningGoals = await prisma.learningGoal.findMany({
    where: {
      userId,
      isActive: true,
      skill: {
        isActive: true
      }
    },
    select: {
      skillId: true
    }
  });

  const wantedSkillIds = learningGoals.map((goal) => goal.skillId);

  if (wantedSkillIds.length === 0) {
    return [];
  }

  const existingMatches = await prisma.match.findMany({
    where: {
      status: {
        in: [
          MatchStatus.PENDING,
          MatchStatus.ACCEPTED,
          MatchStatus.COMPLETED
        ]
      },
      OR: [
        { requesterId: userId },
        { receiverId: userId }
      ]
    },
    select: {
      requesterId: true,
      receiverId: true
    }
  });

  // Exclude users where a match request or match already exists in either direction.
  const unavailableUserIds = existingMatches.map((match) =>
    match.requesterId === userId ? match.receiverId : match.requesterId
  );

  const users = await prisma.user.findMany({
    where: {
      id: {
        not: userId,
        notIn: unavailableUserIds
      },
      status: UserStatus.ACTIVE,
      teachingSkills: {
        some: {
          skillId: {
            in: wantedSkillIds
          },
          skill: {
            isActive: true
          }
        }
      }
    },
    select: suggestionSelect,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: 20
  });

  return users.map((user) => {
    const matchingSkills = user.teachingSkills.filter((teachingSkill) =>
      wantedSkillIds.includes(teachingSkill.skill.id)
    );

    return {
      ...user,
      teachingSkills: matchingSkills,
      matchingSkillCount: matchingSkills.length
    };
  });
};

export const updateMatchRequest = async (
  userId: string,
  matchId: string,
  input: UpdateMatchStatusInput
) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      receiverId: true,
      status: true
    }
  });

  if (!match) {
    throw new HttpError(404, "Match not found");
  }

  if (match.receiverId !== userId) {
    throw new HttpError(403, "Only the receiver can accept or reject this match request");
  }

  if (match.status !== MatchStatus.PENDING) {
    throw new HttpError(400, "Only pending match requests can be updated");
  }

  // Accepting or rejecting is the only transition needed for the MVP flow.
  return prisma.match.update({
    where: { id: matchId },
    data: { status: input.status },
    select: matchSelect
  });
};
