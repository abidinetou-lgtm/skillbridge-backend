import { Router } from "express";
import authRoutes from "./authRoutes";
import healthRoutes from "./healthRoutes";

const router = Router();

// Mount feature route files here. Example: router.use("/users", userRoutes);
router.use("/", healthRoutes);
router.use("/auth", authRoutes);

export default router;
