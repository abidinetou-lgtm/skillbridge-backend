import prisma from "../models/prisma.js"
import { hashPassword } from "../utils/passwords.js";

const getAllUsers = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const usersList = await prisma.user.findMany({
        skip,
        take: limit,
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true
        }
    });

    const usersCount = await prisma.user.count();

    return {
        data: usersList,
        total: usersCount,
        page,
        limit
    };
};

const getUserById = async (id) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true
        }
    });

    return {
        data: user
    };
};

const createUser = async (userData) => {
    const createdUser = await prisma.user.create({
        data: {
            email: userData.email,
            name: userData.name,
            password: await hashPassword(userData.password),
        }
    });

    return {
        data: {
            id: createdUser.id,
            email: createdUser.email,
            name: createdUser.name
        }
    };
};

const updateUser = async (id, userData) => {
    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            ...(userData.email && { email: userData.email }),
            ...(userData.name && { name: userData.name }),
        }
    });

    return {
        data: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name
        }
    };
};

const deleteUser = async (id) => {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        return false;
    }

    await prisma.user.delete({ where: { id } });

    return true;
};

export {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};