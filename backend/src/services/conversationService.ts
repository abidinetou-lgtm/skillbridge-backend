import { prisma } from "../utils/prisma";

export const conversationService = async (userid: string) => {
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