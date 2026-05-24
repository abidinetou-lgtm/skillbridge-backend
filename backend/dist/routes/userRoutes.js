"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Search returns public profile data, so it does not require a JWT.
router.get("/search", userController_1.search);
// Everything below changes or returns private account data, so it must be protected.
router.put("/me", authMiddleware_1.authenticate, userController_1.updateMe);
router.post("/skills", authMiddleware_1.authenticate, userController_1.createSkill);
router.delete("/skills/:id", authMiddleware_1.authenticate, userController_1.deleteSkill);
router.post("/learning-goals", authMiddleware_1.authenticate, userController_1.createLearningGoal);
router.delete("/learning-goals/:id", authMiddleware_1.authenticate, userController_1.deleteLearningGoal);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map