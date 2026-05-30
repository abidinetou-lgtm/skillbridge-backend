"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageService = exports.readConversationService = exports.createConversationService = void 0;
const prisma_1 = require("../utils/prisma");
const httpError_1 = require("../utils/httpError");
const createConversationService = async (userid) => {
    return await prisma_1.prisma.conversation.findMany({
        where: {
            OR: [
                { firstUserId: userid },
                { secondUserId: userid }
            ]
        },
        include: {
            firstUser: {
                select: { firstName: true, lastName: true }
            },
            secondUser: {
                select: { firstName: true, lastName: true }
            },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1
            }
        }
    });
};
exports.createConversationService = createConversationService;
const readConversationService = async (conversationId, userId) => {
    const conversation = await prisma_1.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { firstUser: true, secondUser: true }
    });
    if (!conversation) {
        throw new httpError_1.HttpError(404, "Conversation not found");
    }
    ;
    if (conversation.firstUserId !== userId && conversation.secondUserId !== userId) {
        throw new httpError_1.HttpError(403, "Forbidden");
    }
    return await prisma_1.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" }
    });
};
exports.readConversationService = readConversationService;
const createMessageService = async (conversationId, userId, body) => {
    const conversation = await prisma_1.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { firstUser: true, secondUser: true }
    });
    if (!conversation) {
        throw new httpError_1.HttpError(404, "Conversation not found");
    }
    ;
    if (conversation.firstUserId !== userId && conversation.secondUserId !== userId) {
        throw new httpError_1.HttpError(403, "Forbidden");
    }
    if (!body || body.trim() === "") {
        throw new httpError_1.HttpError(400, "Message body cannot be empty");
    }
    return await prisma_1.prisma.message.create({
        data: {
            conversationId,
            senderId: userId,
            body
        }
    });
};
exports.createMessageService = createMessageService;
//# sourceMappingURL=conversationService.js.map