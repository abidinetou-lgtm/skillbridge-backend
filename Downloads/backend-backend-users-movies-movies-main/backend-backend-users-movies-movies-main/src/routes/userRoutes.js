import { Router } from "express";
import * as userController from "../controllers/userController.js";
import authenticate from "../middlewares/authenticate.js";

const router = Router();

// 🔒 TOUTES les routes protégées
router.get('/users', authenticate, userController.getAllUsers);
router.get('/users/:id', authenticate, userController.getUserById);
router.post('/users', authenticate, userController.createUser);
router.put('/users/:id', authenticate, userController.updateUser);
router.delete('/users/:id', authenticate, userController.deleteUser);

export default router;