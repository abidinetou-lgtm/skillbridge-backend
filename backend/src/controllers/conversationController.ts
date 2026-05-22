import { Request, Response, NextFunction } from "express";
import { getAuthenticatedUserId } from "../controllers/userController";
import { conversationService } from "../services/conversationService";

export const conversationController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const data = await conversationService(userId);
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};