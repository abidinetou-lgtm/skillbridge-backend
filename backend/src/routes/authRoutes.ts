import { Router } from "express";
import { login, me, register } from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);

// Protected route example: the JWT middleware must run before the controller.
router.get("/me", authenticate, me);

export default router;
