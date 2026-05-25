import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError";
import {createConversationService,
        readConversationService,
        createMessageService 
    } from "../services/conversationService";

const getAuthenticatedUserId = (req: any): string => {
  if (!req.user) throw new HttpError(401, "Authentication required");
  return req.user.id;
};

export const createConversationController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const data = await createConversationService(userId);
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

export const readConversationController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const conversationId = req.params.id as string;
        const userId = getAuthenticatedUserId(req)
        const data = await readConversationService (conversationId, userId);
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

export const createMessageController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const conversationId = req.params.id as string;
        const userId = getAuthenticatedUserId(req)
        const body = req.body.body as string;
        const data = await createMessageService (conversationId, userId, body);
        res.status(201).json(data);
    } catch (error) {
        next(error);
    }
};