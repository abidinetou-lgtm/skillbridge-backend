import { Router } from "express";
import * as authController from "../controllers/authController.js";
import authenticate from "../middlewares/authenticate.js";

const router = Router();

router.post("/login", authController.login);
router.post("/register", authController.register);

// 🔥 NOUVEAU
router.get("/me", authenticate, authController.getMe);

export default router;