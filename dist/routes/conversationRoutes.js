"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conversationController_1 = require("../controllers/conversationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get("/", authMiddleware_1.authenticate, conversationController_1.createConversationController);
router.get("/:id", authMiddleware_1.authenticate, conversationController_1.readConversationController);
router.post("/:id/messages", authMiddleware_1.authenticate, conversationController_1.createMessageController);
exports.default = router;
//# sourceMappingURL=conversationRoutes.js.map