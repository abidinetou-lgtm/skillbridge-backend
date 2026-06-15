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

router.get("/",              authenticate, listConversationsController);
router.get("/:id",           authenticate, getConversationController);
router.get("/:id/messages",  authenticate, listMessagesController);
router.post("/:id/messages", authenticate, createMessageController);
router.patch("/:id/archive",   authenticate, archiveConversationController);
router.patch("/:id/unarchive", authenticate, unarchiveConversationController);

// Post a new file message in a conversation
router.post("/:id/messages/file", authenticate, sendFileMessageController);

export default router;