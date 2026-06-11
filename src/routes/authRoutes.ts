import { Router } from "express";
import {
  login,
  me,
  register,
  resendVerification,
  verifyEmail
} from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

// Protected route example: the JWT middleware must run before the controller.
router.get("/me", authenticate, me);

export default router;
