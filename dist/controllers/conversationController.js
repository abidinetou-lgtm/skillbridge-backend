"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageController = exports.readConversationController = exports.createConversationController = void 0;
const httpError_1 = require("../utils/httpError");
const conversationService_1 = require("../services/conversationService");
const getAuthenticatedUserId = (req) => {
    if (!req.user)
        throw new httpError_1.HttpError(401, "Authentication required");
    return req.user.id;
};
const createConversationController = async (req, res, next) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const conversations = await (0, conversationService_1.createConversationService)(userId);
        res.status(200).json({ conversations });
    }
    catch (error) {
        next(error);
    }
};
exports.createConversationController = createConversationController;
const readConversationController = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const userId = getAuthenticatedUserId(req);
        const messages = await (0, conversationService_1.readConversationService)(conversationId, userId);
        res.status(200).json({ messages });
    }
    catch (error) {
        next(error);
    }
};
exports.readConversationController = readConversationController;
const createMessageController = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const userId = getAuthenticatedUserId(req);
        const body = req.body.body;
        const data = await (0, conversationService_1.createMessageService)(conversationId, userId, body);
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
};
exports.createMessageController = createMessageController;
//# sourceMappingURL=conversationController.js.map