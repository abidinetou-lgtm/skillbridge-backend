import { Router } from "express";
import {
  getMatchSuggestions,
  getMyMatches,
  requestMatch,
  updateMatch
} from "../controllers/matchController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// Match requests expose user-to-user state, so every route requires a valid JWT.
router.post("/request", authenticate, requestMatch);
router.get("/suggestions", authenticate, getMatchSuggestions);
router.get("/mine", authenticate, getMyMatches);
router.patch("/:id", authenticate, updateMatch);

export default router;
