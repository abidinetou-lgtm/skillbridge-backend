import prisma from "../models/prisma.js";
import { comparePasswords, hashPassword } from "../utils/passwords.js";
import { generateToken } from "../utils/token.js";

const login = async (email, password) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        const error = new Error("Invalid email or password");
        error.status = 401;
        throw error;
    }

    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
        const error = new Error("Invalid email or password");
        error.status = 401;
        throw error;
    }

    const token = await generateToken(user.id);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
        },
        token
    };
};

const register = async (email, password, name) => {
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        const error = new Error("Email already in use");
        error.status = 409;
        throw error;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword
        }
    });

    const token = await generateToken(user.id);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
        },
        token
    };
};

// 🔥 NOUVEAU : GET CURRENT USER
const getMe = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!user) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
    }

    return user;
};

export { login, register, getMe };