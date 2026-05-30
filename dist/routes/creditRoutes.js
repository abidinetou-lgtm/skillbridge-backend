"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const creditController_1 = require("../controllers/creditController");
const router = (0, express_1.Router)();
router.get("/", authMiddleware_1.authenticate, creditController_1.getCreditController);
exports.default = router;
//# sourceMappingURL=creditRoutes.js.map