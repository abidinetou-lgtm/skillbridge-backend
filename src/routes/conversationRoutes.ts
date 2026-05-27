import { Router } from "express";
import { createConversationController, readConversationController, createMessageController } from "../controllers/conversationController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticate, createConversationController);
router.get("/:id/messages", authenticate, readConversationController);
router.get("/:id", authenticate, readConversationController);
router.post("/:id/messages", authenticate, createMessageController);

export default router;
