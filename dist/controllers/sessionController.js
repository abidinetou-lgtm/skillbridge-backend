"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinSessionController = exports.endSessionController = exports.createSessionController = void 0;
const userController_1 = require("./userController");
const sessionService_1 = require("../services/sessionService");
const createSessionController = async (req, res, next) => {
    try {
        const { learnerId, title, estimatedDuration, scheduledAt } = req.body;
        const teacherId = (0, userController_1.getAuthenticatedUserId)(req);
        const data = await (0, sessionService_1.createSessionService)(teacherId, learnerId, title, estimatedDuration, scheduledAt);
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
};
exports.createSessionController = createSessionController;
const endSessionController = async (req, res, next) => {
    try {
        const sessionId = req.params.id;
        const userId = (0, userController_1.getAuthenticatedUserId)(req);
        await (0, sessionService_1.endSessionService)(sessionId, userId);
        res.status(200).json({ message: "Session ended successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.endSessionController = endSessionController;
const joinSessionController = async (req, res, next) => {
    try {
        const sessionId = req.params.id;
        const userId = (0, userController_1.getAuthenticatedUserId)(req);
        const jitsiRoomId = await (0, sessionService_1.joinSessionService)(sessionId, userId);
        res.status(200).json({
            jitsiRoomId,
            jitsiUrl: `https://meet.jit.si/${jitsiRoomId}`
        });
    }
    catch (error) {
        next(error);
    }
};
exports.joinSessionController = joinSessionController;
//# sourceMappingURL=sessionController.js.map