"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageService = exports.readConversationService = exports.createConversationService = void 0;
const prisma_1 = require("../utils/prisma");
const httpError_1 = require("../utils/httpError");
const createConversationService = async (userId) => {
    const conversations = await prisma_1.prisma.conversation.findMany({
        where: {
            OR: [
                { firstUserId: userId },
                { secondUserId: userId }
            ]
        },
        include: {
            firstUser: {
                select: { id: true, firstName: true, lastName: true }
            },
            secondUser: {
                select: { id: true, firstName: true, lastName: true }
            },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                include: {
                    sender: { select: { id: true, firstName: true, lastName: true } }
                }
            }
        }
    });
    // Compute the "other" user from each conversation for the current user
    return conversations.map(conv => ({
        id: conv.id,
        status: conv.status,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        other: conv.firstUserId === userId ? conv.secondUser : conv.firstUser,
        lastMessage: conv.messages[0] ?? null,
    }));
};
exports.createConversationService = createConversationService;
const readConversationService = async (conversationId, userId) => {
    const conversation = await prisma_1.prisma.conversation.findUnique({
        where: { id: conversationId }
    });
    if (!conversation) {
        throw new httpError_1.HttpError(404, "Conversation not found");
    }
    if (conversation.firstUserId !== userId && conversation.secondUserId !== userId) {
        throw new httpError_1.HttpError(403, "Forbidden");
    }
    return prisma_1.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        include: {
            sender: { select: { id: true, firstName: true, lastName: true } }
        }
    });
};
exports.readConversationService = readConversationService;
const createMessageService = async (conversationId, userId, body) => {
    const conversation = await prisma_1.prisma.conversation.findUnique({
        where: { id: conversationId }
    });
    if (!conversation) {
        throw new httpError_1.HttpError(404, "Conversation not found");
    }
    if (conversation.firstUserId !== userId && conversation.secondUserId !== userId) {
        throw new httpError_1.HttpError(403, "Forbidden");
    }
    if (!body || body.trim() === "") {
        throw new httpError_1.HttpError(400, "Message body cannot be empty");
    }
    return prisma_1.prisma.message.create({
        data: {
            conversationId,
            senderId: userId,
            body: body.trim()
        },
        include: {
            sender: { select: { id: true, firstName: true, lastName: true } }
        }
    });
};
exports.createMessageService = createMessageService;
//# sourceMappingURL=conversationService.js.map