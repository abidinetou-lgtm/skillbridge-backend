"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageController = exports.listMessagesController = exports.getConversationController = exports.listConversationsController = void 0;
const requestHelpers_1 = require("../utils/requestHelpers");
const conversationService_1 = require("../services/conversationService");
// GET /conversations
const listConversationsController = async (req, res, next) => {
    try {
        const userId = (0, requestHelpers_1.getAuthenticatedUserId)(req);
        const conversations = await (0, conversationService_1.listConversationsService)(userId);
        res.status(200).json({ conversations });
    }
    catch (error) {
        next(error);
    }
};
exports.listConversationsController = listConversationsController;
// GET /conversations/:id
const getConversationController = async (req, res, next) => {
    try {
        const userId = (0, requestHelpers_1.getAuthenticatedUserId)(req);
        const conversationId = req.params.id;
        const conversation = await (0, conversationService_1.getConversationService)(conversationId, userId);
        res.status(200).json({ conversation });
    }
    catch (error) {
        next(error);
    }
};
exports.getConversationController = getConversationController;
// GET /conversations/:id/messages
const listMessagesController = async (req, res, next) => {
    try {
        const userId = (0, requestHelpers_1.getAuthenticatedUserId)(req);
        const conversationId = req.params.id;
        const messages = await (0, conversationService_1.listMessagesService)(conversationId, userId);
        res.status(200).json({ messages });
    }
    catch (error) {
        next(error);
    }
};
exports.listMessagesController = listMessagesController;
// POST /conversations/:id/messages
const createMessageController = async (req, res, next) => {
    try {
        const userId = (0, requestHelpers_1.getAuthenticatedUserId)(req);
        const conversationId = req.params.id;
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