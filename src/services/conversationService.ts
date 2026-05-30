import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";

/**
 * Returns all conversations the user participates in, with the last message
 * and the "other" participant pre-computed for the UI.
 */
export const listConversationsService = async (userId: string) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { firstUserId: userId },
        { secondUserId: userId },
      ],
    },
    include: {
      firstUser: {
        select: { id: true, firstName: true, lastName: true },
      },
      secondUser: {
        select: { id: true, firstName: true, lastName: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  return conversations.map((conv) => ({
    id: conv.id,
    status: conv.status,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    other: conv.firstUserId === userId ? conv.secondUser : conv.firstUser,
    lastMessage: conv.messages[0] ?? null,
  }));
};

/**
 * Returns the metadata (id, status, participants) of a single conversation.
 * Only participants may access it.
 */
export const getConversationService = async (
  conversationId: string,
  userId: string
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      firstUser: { select: { id: true, firstName: true, lastName: true } },
      secondUser: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!conversation) throw new HttpError(404, "Conversation not found");
  if (
    conversation.firstUserId !== userId &&
    conversation.secondUserId !== userId
  ) {
    throw new HttpError(403, "Forbidden");
  }

  return {
    id: conversation.id,
    status: conversation.status,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    other:
      conversation.firstUserId === userId
        ? conversation.secondUser
        : conversation.firstUser,
  };
};

/**
 * Returns all messages of a conversation in chronological order.
 * Only participants may read it.
 */
export const listMessagesService = async (
  conversationId: string,
  userId: string
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) throw new HttpError(404, "Conversation not found");
  if (
    conversation.firstUserId !== userId &&
    conversation.secondUserId !== userId
  ) {
    throw new HttpError(403, "Forbidden");
  }

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

/**
 * Creates a new message in the conversation.
 * Only participants may post.
 */
export const createMessageService = async (
  conversationId: string,
  userId: string,
  body: string
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) throw new HttpError(404, "Conversation not found");
  if (
    conversation.firstUserId !== userId &&
    conversation.secondUserId !== userId
  ) {
    throw new HttpError(403, "Forbidden");
  }
  if (!body || body.trim() === "") {
    throw new HttpError(400, "Message body cannot be empty");
  }

  return prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      body: body.trim(),
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};