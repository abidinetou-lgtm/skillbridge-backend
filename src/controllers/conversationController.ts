import { Request, Response, NextFunction } from "express";
import { getAuthenticatedUserId } from "../utils/requestHelpers";
import {
  listConversationsService,
  getConversationService,
  listMessagesService,
  createMessageService,
  archiveConversationService,
  unarchiveConversationService,
} from "../services/conversationService";

// GET /conversations
export const listConversationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const conversations = await listConversationsService(userId);
    res.status(200).json({ conversations });
  } catch (error) {
    next(error);
  }
};

// GET /conversations/:id
export const getConversationController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const conversationId = req.params.id as string;
    const conversation = await getConversationService(conversationId, userId);
    res.status(200).json({ conversation });
  } catch (error) {
    next(error);
  }
};

// GET /conversations/:id/messages
export const listMessagesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const conversationId = req.params.id as string;
    const messages = await listMessagesService(conversationId, userId);
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

// POST /conversations/:id/messages
export const createMessageController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const conversationId = req.params.id as string;
    const body = req.body.body as string;
    const data = await createMessageService(conversationId, userId, body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

// PATCH /conversations/:id/archive
export const archiveConversationController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const conversationId = req.params.id as string;
    const data = await archiveConversationService(conversationId, userId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// PATCH /conversations/:id/unarchive
export const unarchiveConversationController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const conversationId = req.params.id as string;
    const data = await unarchiveConversationService(conversationId, userId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};