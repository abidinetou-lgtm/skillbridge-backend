import { Request, Response, NextFunction } from "express";
import { getAuthenticatedUserId } from "../controllers/userController";
import {createConversationService,
        readConversationService,
        createMessageService 
    } from "../services/conversationService";


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