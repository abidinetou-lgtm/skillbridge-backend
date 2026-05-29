"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const sessionController_1 = require("../controllers/sessionController");
const router = (0, express_1.Router)();
router.post("/", authMiddleware_1.authenticate, sessionController_1.createSessionController);
router.post("/:id/end", authMiddleware_1.authenticate, sessionController_1.endSessionController);
router.post("/:id/join", authMiddleware_1.authenticate, sessionController_1.joinSessionController);
exports.default = router;
//# sourceMappingURL=sessionRoutes.js.map