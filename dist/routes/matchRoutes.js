"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const matchController_1 = require("../controllers/matchController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Suggestions depend on the current user's learning goals, so a JWT is required.
router.get("/suggestions", authMiddleware_1.authenticate, matchController_1.suggestions);
router.post("/request", authMiddleware_1.authenticate, matchController_1.request);
router.get("/mine", authMiddleware_1.authenticate, matchController_1.mine);
router.patch("/:id", authMiddleware_1.authenticate, matchController_1.update);
exports.default = router;
//# sourceMappingURL=matchRoutes.js.map