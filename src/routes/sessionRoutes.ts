import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { createSessionController, endSessionController, joinSessionController } from "../controllers/sessionController";

const router = Router();

router.post("/", authenticate, createSessionController);
router.post("/:id/end", authenticate, endSessionController);
router.post("/:id/join", authenticate, joinSessionController);

export default router;