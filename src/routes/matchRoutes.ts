import { Router } from "express";
import { mine, request, suggestions, update } from "../controllers/matchController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// Suggestions depend on the current user's learning goals, so a JWT is required.
router.get("/suggestions", authenticate, suggestions);
router.post("/request", authenticate, request);
router.get("/mine", authenticate, mine);
router.patch("/:id", authenticate, update);

export default router;
