import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";

export const createConversationService = async (userid: string) => {
    return await prisma.conversation.findMany({
        where: {
            OR: [
                { firstUserId : userid },
                {secondUserId : userid }
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

export const readConversationService = async (conversationId: string, userId: string) => {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { firstUser: true, secondUser: true }
    });
    if (!conversation) {
            throw new HttpError(404, "Conversation not found");
        };
    if (conversation.firstUserId !== userId && conversation.secondUserId !== userId) {
            throw new HttpError(403, "Forbidden");
        }
    return await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" }
    })  
};

export const createMessageService = async (conversationId: string, userId: string, body: string) => {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { firstUser: true, secondUser: true }
    });
    if (!conversation) {
            throw new HttpError(404, "Conversation not found");
        };
    if (conversation.firstUserId !== userId && conversation.secondUserId !== userId) {
            throw new HttpError(403, "Forbidden");
        }
    if (!body || body.trim() === "") {
            throw new HttpError(400, "Message body cannot be empty");
    }
    return await prisma.message.create({
        data: {
            conversationId,
            senderId: userId,
            body
        }
    })
    };