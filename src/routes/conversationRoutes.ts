import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  listConversationsController,
  getConversationController,
  listMessagesController,
  createMessageController,
  sendFileMessageController,
} from "../controllers/conversationController";

const router = Router();

// List all conversations for the authenticated user
router.get("/", authenticate, listConversationsController);

// Get a single conversation's metadata (participants, status)
router.get("/:id", authenticate, getConversationController);

// List all messages in a conversation
router.get("/:id/messages", authenticate, listMessagesController);

// Post a new message in a conversation
router.post("/:id/messages", authenticate, createMessageController);

// Post a new file message in a conversation
router.post("/:id/messages/file", authenticate, sendFileMessageController);

export default router;