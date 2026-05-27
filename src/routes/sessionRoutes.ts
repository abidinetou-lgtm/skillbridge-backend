import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  createSessionController,
  endSessionController,
  joinSessionController,
  getSessionsController,
  getSessionController,
} from "../controllers/sessionController";

const router = Router();

router.get("/mine",       authenticate, getSessionsController);
router.get("/:id",        authenticate, getSessionController);
router.post("/",          authenticate, createSessionController);
router.post("/:id/end",   authenticate, endSessionController);
router.post("/:id/join",  authenticate, joinSessionController);

export default router;