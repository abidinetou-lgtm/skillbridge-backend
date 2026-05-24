"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.removeLearningGoal = exports.addLearningGoal = exports.removeUserSkill = exports.addUserSkill = exports.getPublicUserProfile = exports.getCurrentUserProfile = exports.updateUserProfile = void 0;
const client_1 = require("@prisma/client");
const httpError_1 = require("../utils/httpError");
const prisma_1 = require("../utils/prisma");
const skillSelect = {
    id: true,
    name: true,
    description: true,
    category: true
};
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
};
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
};
const currentUserSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    bio: true,
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
};
const publicUserSelect = {
    id: true,
    firstName: true,
    lastName: true,
    bio: true,
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
};
const ensureActiveUser = async (userId) => {
    const user = await prisma_1.prisma.user.findFirst({
        where: {
            id: userId,
            status: client_1.UserStatus.ACTIVE
        },
        select: { id: true }
    });
    if (!user) {
        throw new httpError_1.HttpError(404, "User not found");
    }
};
const getOrCreateSkill = async (input) => {
    if (input.skillId) {
        const skill = await prisma_1.prisma.skill.findFirst({
            where: {
                id: input.skillId,
                isActive: true
            }
        });
        if (!skill) {
            throw new httpError_1.HttpError(404, "Skill not found");
        }
        return skill;
    }
    if (!input.name) {
        throw new httpError_1.HttpError(400, "skillId or name is required");
    }
    // Upsert lets clients add a new skill name or reuse an existing one with one call.
    const skill = await prisma_1.prisma.skill.upsert({
        where: { name: input.name },
        update: {},
        create: {
            name: input.name,
            category: "category" in input ? input.category ?? undefined : undefined
        }
    });
    if (!skill.isActive) {
        throw new httpError_1.HttpError(404, "Skill not found");
    }
    return skill;
};
const updateUserProfile = async (userId, input) => {
    await ensureActiveUser(userId);
    const data = {};
    if (input.firstName !== undefined) {
        data.firstName = input.firstName;
    }
    if (input.lastName !== undefined) {
        data.lastName = input.lastName;
    }
    if (input.bio !== undefined) {
        data.bio = input.bio;
    }
    return prisma_1.prisma.user.update({
        where: { id: userId },
        data,
        select: currentUserSelect
    });
};
exports.updateUserProfile = updateUserProfile;
const getCurrentUserProfile = async (userId) => {
    await ensureActiveUser(userId);
    return prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: currentUserSelect
    });
};
exports.getCurrentUserProfile = getCurrentUserProfile;
const getPublicUserProfile = async (userId) => {
    const user = await prisma_1.prisma.user.findFirst({
        where: {
            id: userId,
            status: client_1.UserStatus.ACTIVE
        },
        select: publicUserSelect
    });
    if (!user) {
        throw new httpError_1.HttpError(404, "User not found");
    }
    return user;
};
exports.getPublicUserProfile = getPublicUserProfile;
const addUserSkill = async (userId, input) => {
    await ensureActiveUser(userId);
    const skill = await getOrCreateSkill(input);
    const userSkill = await prisma_1.prisma.userSkill.upsert({
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
exports.addUserSkill = addUserSkill;
const removeUserSkill = async (userId, userSkillId) => {
    const userSkill = await prisma_1.prisma.userSkill.findFirst({
        where: {
            id: userSkillId,
            userId
        },
        select: { id: true }
    });
    if (!userSkill) {
        throw new httpError_1.HttpError(404, "User skill not found");
    }
    // Deleting the join row removes only this user's skill, not the global Skill record.
    await prisma_1.prisma.userSkill.delete({
        where: { id: userSkillId }
    });
};
exports.removeUserSkill = removeUserSkill;
const addLearningGoal = async (userId, input) => {
    await ensureActiveUser(userId);
    const skill = await getOrCreateSkill(input);
    const learningGoal = await prisma_1.prisma.learningGoal.upsert({
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
exports.addLearningGoal = addLearningGoal;
const removeLearningGoal = async (userId, learningGoalId) => {
    const learningGoal = await prisma_1.prisma.learningGoal.findFirst({
        where: {
            id: learningGoalId,
            userId
        },
        select: { id: true }
    });
    if (!learningGoal) {
        throw new httpError_1.HttpError(404, "Learning goal not found");
    }
    await prisma_1.prisma.learningGoal.delete({
        where: { id: learningGoalId }
    });
};
exports.removeLearningGoal = removeLearningGoal;
const searchUsers = async (input) => {
    const query = input.query?.trim();
    const skill = input.skill?.trim();
    if (!query && !skill) {
        throw new httpError_1.HttpError(400, "q or skill query parameter is required");
    }
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
    const filters = [];
    if (query) {
        // A general search term should scan public profile text and related skill names.
        filters.push({ firstName: { contains: query, mode: "insensitive" } }, { lastName: { contains: query, mode: "insensitive" } }, { bio: { contains: query, mode: "insensitive" } }, {
            teachingSkills: {
                some: {
                    skill: {
                        is: {
                            name: { contains: query, mode: "insensitive" },
                            isActive: true
                        }
                    }
                }
            }
        }, {
            learningGoals: {
                some: {
                    isActive: true,
                    skill: {
                        is: {
                            name: { contains: query, mode: "insensitive" },
                            isActive: true
                        }
                    }
                }
            }
        });
    }
    if (skill) {
        // The dedicated skill filter searches only skill relations, not profile text.
        filters.push({
            teachingSkills: {
                some: {
                    skill: {
                        is: {
                            name: { contains: skill, mode: "insensitive" },
                            isActive: true
                        }
                    }
                }
            }
        }, {
            learningGoals: {
                some: {
                    isActive: true,
                    skill: {
                        is: {
                            name: { contains: skill, mode: "insensitive" },
                            isActive: true
                        }
                    }
                }
            }
        });
    }
    return prisma_1.prisma.user.findMany({
        where: {
            status: client_1.UserStatus.ACTIVE,
            OR: filters
        },
        select: publicUserSelect,
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        take: limit
    });
};
exports.searchUsers = searchUsers;
//# sourceMappingURL=userService.js.map