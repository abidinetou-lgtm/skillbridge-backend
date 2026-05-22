import { Router } from "express";
import { conversationController } from "../controllers/conversationController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticate, conversationController);

export default router;
