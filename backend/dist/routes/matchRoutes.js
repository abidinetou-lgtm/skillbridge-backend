"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const matchController_1 = require("../controllers/matchController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Match requests expose user-to-user state, so every route requires a valid JWT.
router.post("/request", authMiddleware_1.authenticate, matchController_1.requestMatch);
router.get("/suggestions", authMiddleware_1.authenticate, matchController_1.getMatchSuggestions);
router.get("/mine", authMiddleware_1.authenticate, matchController_1.getMyMatches);
router.patch("/:id", authMiddleware_1.authenticate, matchController_1.updateMatch);
exports.default = router;
//# sourceMappingURL=matchRoutes.js.map