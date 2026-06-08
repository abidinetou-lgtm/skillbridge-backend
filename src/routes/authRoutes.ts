import { Router } from "express";
import {
  forgotPassword,
  login,
  me,
  register,
  resetPassword
} from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";
import { authRateLimiter } from "../middleware/authRateLimit";

const router = Router();

router.use(
  ["/register", "/login", "/forgot-password", "/reset-password"],
  authRateLimiter
);

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected route example: the JWT middleware must run before the controller.
router.get("/me", authenticate, me);

export default router;
