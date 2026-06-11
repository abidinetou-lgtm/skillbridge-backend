"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const conversationController_1 = require("../controllers/conversationController");
const router = (0, express_1.Router)();
// List all conversations for the authenticated user
router.get("/", authMiddleware_1.authenticate, conversationController_1.listConversationsController);
// Get a single conversation's metadata (participants, status)
router.get("/:id", authMiddleware_1.authenticate, conversationController_1.getConversationController);
// List all messages in a conversation
router.get("/:id/messages", authMiddleware_1.authenticate, conversationController_1.listMessagesController);
// Post a new message in a conversation
router.post("/:id/messages", authMiddleware_1.authenticate, conversationController_1.createMessageController);
exports.default = router;
//# sourceMappingURL=conversationRoutes.js.map