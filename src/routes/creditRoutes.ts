import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { getCreditController } from "../controllers/creditController";

const router = Router();

router.get("/", authenticate, getCreditController);

export default router;