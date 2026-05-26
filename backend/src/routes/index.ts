import { Router } from "express";
import authRoutes from "./authRoutes";
import healthRoutes from "./healthRoutes";
import userRoutes from "./userRoutes";
import conversationRoutes from "./conversationRoutes";
import sessionRoutes from "./sessionRoutes";

const router = Router();

// Mount feature route files here. Example: router.use("/users", userRoutes);
router.use("/", healthRoutes);
router.use("/sessions", sessionRoutes);
router.use("/conversations", conversationRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;
