import { Router } from "express";
import {
  createLearningGoal,
  createSkill,
  deleteLearningGoal,
  deleteSkill,
  getById,
  getMe,
  search,
  updateMe
} from "../controllers/userController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// Search returns public profile data, so it does not require a JWT.
router.get("/search", search);

// Everything below changes or returns private account data, so it must be protected.
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, updateMe);
router.patch("/me", authenticate, updateMe);
router.get("/:id", getById);
router.post("/skills", authenticate, createSkill);
router.delete("/skills/:id", authenticate, deleteSkill);
router.post("/learning-goals", authenticate, createLearningGoal);
router.delete("/learning-goals/:id", authenticate, deleteLearningGoal);

export default router;
