import { Router } from "express";
import authRoutes from "./authRoutes";
import healthRoutes from "./healthRoutes";
import matchRoutes from "./matchRoutes";
import userRoutes from "./userRoutes";

const router = Router();

// Mount feature route files here. Example: router.use("/users", userRoutes);
router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/matches", matchRoutes);

export default router;
