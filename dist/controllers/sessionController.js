"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinSessionController = exports.endSessionController = exports.createSessionController = exports.getSessionController = exports.getSessionsController = void 0;
const httpError_1 = require("../utils/httpError");
const prisma_1 = require("../utils/prisma");
const sessionService_1 = require("../services/sessionService");
const getAuthenticatedUserId = (req) => {
    if (!req.user)
        throw new httpError_1.HttpError(401, "Authentication required");
    return req.user.id;
};
// GET /sessions/mine
const getSessionsController = async (req, res, next) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const sessions = await prisma_1.prisma.teachingSession.findMany({
            where: {
                OR: [{ teacherId: userId }, { learnerId: userId }],
            },
            select: {
                id: true,
                status: true,
                startsAt: true,
                title: true,
                jitsiRoomId: true,
                creditsReserved: true,
                creditsConsumed: true,
                actualStartedAt: true,
                actualEndedAt: true,
                teacher: { select: { id: true, firstName: true, lastName: true } },
                learner: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { startsAt: "desc" },
        });
        res.status(200).json({ sessions });
    }
    catch (error) {
        next(error);
    }
};
exports.getSessionsController = getSessionsController;
// GET /sessions/:id
const getSessionController = async (req, res, next) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const sessionId = req.params.id;
        const session = await prisma_1.prisma.teachingSession.findFirst({
            where: {
                id: sessionId,
                OR: [{ teacherId: userId }, { learnerId: userId }],
            },
            select: {
                id: true,
                status: true,
                startsAt: true,
                title: true,
                jitsiRoomId: true,
                creditsReserved: true,
                creditsConsumed: true,
                actualStartedAt: true,
                actualEndedAt: true,
                teacher: { select: { id: true, firstName: true, lastName: true } },
                learner: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        if (!session)
            throw new httpError_1.HttpError(404, "Session not found");
        res.status(200).json({ session });
    }
    catch (error) {
        next(error);
    }
};
exports.getSessionController = getSessionController;
// POST /sessions
const createSessionController = async (req, res, next) => {
    try {
        const teacherId = getAuthenticatedUserId(req);
        const { learnerId, title, estimatedDuration, scheduledAt } = req.body;
        if (!learnerId || typeof learnerId !== "string")
            throw new httpError_1.HttpError(400, "learnerId is required");
        if (!title || typeof title !== "string")
            throw new httpError_1.HttpError(400, "title is required");
        if (!estimatedDuration || typeof estimatedDuration !== "number")
            throw new httpError_1.HttpError(400, "estimatedDuration (number) is required");
        if (!scheduledAt)
            throw new httpError_1.HttpError(400, "scheduledAt is required");
        const session = await (0, sessionService_1.createSessionService)(teacherId, learnerId, title, estimatedDuration, new Date(scheduledAt));
        res.status(201).json({ session });
    }
    catch (error) {
        next(error);
    }
};
exports.createSessionController = createSessionController;
// POST /sessions/:id/end
const endSessionController = async (req, res, next) => {
    try {
        const sessionId = req.params.id;
        const userId = getAuthenticatedUserId(req);
        await (0, sessionService_1.endSessionService)(sessionId, userId);
        res.status(200).json({ message: "Session ended successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.endSessionController = endSessionController;
// POST /sessions/:id/join
const joinSessionController = async (req, res, next) => {
    try {
        const sessionId = req.params.id;
        const userId = getAuthenticatedUserId(req);
        const jitsiRoomId = await (0, sessionService_1.joinSessionService)(sessionId, userId);
        res.status(200).json({
            jitsiRoomId,
            jitsiUrl: `https://meet.jit.si/${jitsiRoomId}`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.joinSessionController = joinSessionController;
//# sourceMappingURL=sessionController.js.map