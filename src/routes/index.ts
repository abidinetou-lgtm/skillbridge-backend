import { Router } from "express";
import authRoutes from "./authRoutes";
import healthRoutes from "./healthRoutes";
import matchRoutes from "./matchRoutes";
import userRoutes from "./userRoutes";
import conversationRoutes from "./conversationRoutes";
import sessionRoutes from "./sessionRoutes";
import creditRoutes from "./creditRoutes";

const router = Router();

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/matches", matchRoutes);
router.use("/conversations", conversationRoutes);
router.use("/sessions", sessionRoutes);
router.use("/credits", creditRoutes);

export default router;