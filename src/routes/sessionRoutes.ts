import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  createGroupSessionController,
  createSessionRatingController,
  createSessionController,
  endSessionController,
  joinSessionController,
  addParticipantSessionController,
  removeParticipantSessionController,
  getParticipantsSessionController,
  getSessionsController,
  getSessionController,
} from "../controllers/sessionController";

const router = Router();

router.get("/mine",        authenticate, getSessionsController);
router.post("/",           authenticate, createSessionController);
router.post("/group",      authenticate, createGroupSessionController); // ← avant /:id
router.get("/:id",         authenticate, getSessionController);
router.post("/:id/end",    authenticate, endSessionController);
router.post("/:id/join",   authenticate, joinSessionController);
router.post("/:id/rating", authenticate, createSessionRatingController);
router.post("/:id/participants", authenticate, addParticipantSessionController);
router.delete("/:id/participants/:userId", authenticate, removeParticipantSessionController);
router.get("/:id/participants", authenticate, getParticipantsSessionController);

export default router;
