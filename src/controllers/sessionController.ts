import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError";
import { getAuthenticatedUserId } from "./userController";
import { createSessionService, endSessionService, joinSessionService } from "../services/sessionService";



export const createSessionController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { learnerId, title, estimatedDuration, scheduledAt } = req.body;
        const teacherId = getAuthenticatedUserId(req);
        const data = await createSessionService(teacherId, learnerId, title, estimatedDuration, scheduledAt);
        res.status(201).json(data);
    } catch (error) {
        next(error);
    }
};

export const endSessionController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const sessionId = req.params.id as string;
        const userId = getAuthenticatedUserId(req);
        await endSessionService(sessionId, userId);
        res.status(200).json({ message: "Session ended successfully" });

    } catch (error) {
        next(error);
    }
};

export const joinSessionController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const sessionId = req.params.id as string;
        const userId = getAuthenticatedUserId(req);
        const jitsiRoomId = await joinSessionService(sessionId, userId);
        res.status(200).json({
            jitsiRoomId,
            jitsiUrl: `https://meet.jit.si/${jitsiRoomId}`
        });
    } catch (error) {
        next(error);
    }
};