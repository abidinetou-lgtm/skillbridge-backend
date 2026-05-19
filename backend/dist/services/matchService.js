"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMatchRequest = exports.listMatchSuggestions = exports.listMyMatches = exports.sendMatchRequest = void 0;
const client_1 = require("@prisma/client");
const httpError_1 = require("../utils/httpError");
const prisma_1 = require("../utils/prisma");
const publicUserSelect = {
    id: true,
    firstName: true,
    lastName: true,
    bio: true
};
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
};
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
};
const ensureActiveUser = async (userId, message = "User not found") => {
    const user = await prisma_1.prisma.user.findFirst({
        where: {
            id: userId,
            status: client_1.UserStatus.ACTIVE
        },
        select: { id: true }
    });
    if (!user) {
        throw new httpError_1.HttpError(404, message);
    }
};
const ensureActiveSkill = async (skillId) => {
    const skill = await prisma_1.prisma.skill.findFirst({
        where: {
            id: skillId,
            isActive: true
        },
        select: { id: true }
    });
    if (!skill) {
        throw new httpError_1.HttpError(404, "Skill not found");
    }
};
const sendMatchRequest = async (requesterId, input) => {
    if (requesterId === input.receiverId) {
        throw new httpError_1.HttpError(400, "You cannot request a match with yourself");
    }
    const skillId = input.skillId ?? null;
    await ensureActiveUser(requesterId, "Requester not found");
    await ensureActiveUser(input.receiverId, "Receiver not found");
    if (skillId) {
        await ensureActiveSkill(skillId);
    }
    // Pending requests are unique per user pair and skill, regardless of who sent first.
    const existingPendingMatch = await prisma_1.prisma.match.findFirst({
        where: {
            status: client_1.MatchStatus.PENDING,
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
        throw new httpError_1.HttpError(409, "A pending match request already exists");
    }
    try {
        return await prisma_1.prisma.match.create({
            data: {
                requesterId,
                receiverId: input.receiverId,
                skillId,
                message: input.message
            },
            select: matchSelect
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002") {
            throw new httpError_1.HttpError(409, "A match already exists for these users and skill");
        }
        throw error;
    }
};
exports.sendMatchRequest = sendMatchRequest;
const listMyMatches = async (userId) => {
    await ensureActiveUser(userId);
    return prisma_1.prisma.match.findMany({
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
exports.listMyMatches = listMyMatches;
const listMatchSuggestions = async (userId) => {
    await ensureActiveUser(userId);
    const learningGoals = await prisma_1.prisma.learningGoal.findMany({
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
    const existingMatches = await prisma_1.prisma.match.findMany({
        where: {
            status: {
                in: [
                    client_1.MatchStatus.PENDING,
                    client_1.MatchStatus.ACCEPTED,
                    client_1.MatchStatus.COMPLETED
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
    const unavailableUserIds = existingMatches.map((match) => match.requesterId === userId ? match.receiverId : match.requesterId);
    const users = await prisma_1.prisma.user.findMany({
        where: {
            id: {
                not: userId,
                notIn: unavailableUserIds
            },
            status: client_1.UserStatus.ACTIVE,
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
        const matchingSkills = user.teachingSkills.filter((teachingSkill) => wantedSkillIds.includes(teachingSkill.skill.id));
        return {
            ...user,
            teachingSkills: matchingSkills,
            matchingSkillCount: matchingSkills.length
        };
    });
};
exports.listMatchSuggestions = listMatchSuggestions;
const updateMatchRequest = async (userId, matchId, input) => {
    const match = await prisma_1.prisma.match.findUnique({
        where: { id: matchId },
        select: {
            id: true,
            receiverId: true,
            status: true
        }
    });
    if (!match) {
        throw new httpError_1.HttpError(404, "Match not found");
    }
    if (match.receiverId !== userId) {
        throw new httpError_1.HttpError(403, "Only the receiver can accept or reject this match request");
    }
    if (match.status !== client_1.MatchStatus.PENDING) {
        throw new httpError_1.HttpError(400, "Only pending match requests can be updated");
    }
    // Accepting or rejecting is the only transition needed for the MVP flow.
    return prisma_1.prisma.match.update({
        where: { id: matchId },
        data: { status: input.status },
        select: matchSelect
    });
};
exports.updateMatchRequest = updateMatchRequest;
//# sourceMappingURL=matchService.js.map