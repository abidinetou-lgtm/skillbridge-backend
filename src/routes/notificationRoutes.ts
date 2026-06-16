import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  createNotificationController,
  getNotificationsController,
  markNotificationAsReadController,
} from "../controllers/notificationController";

const router = Router();

router.post("/", authenticate, createNotificationController);
router.get("/", authenticate, getNotificationsController);
router.patch("/:id/read", authenticate, markNotificationAsReadController);

export default router;