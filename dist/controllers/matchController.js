"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.mine = exports.request = exports.suggestions = void 0;
const client_1 = require("@prisma/client");
const matchService_1 = require("../services/matchService");
const httpError_1 = require("../utils/httpError");
const requestHelpers_1 = require("../utils/requestHelpers");
const suggestions = async (req, res, next) => {
    try {
        const userId = (0, requestHelpers_1.getAuthenticatedUserId)(req);
        const matches = await (0, matchService_1.getMatchSuggestions)(userId);
        // Return a simple list for the MVP. More match metadata can be added later.
        res.status(200).json({ suggestions: matches });
    }
    catch (error) {
        next(error);
    }
};
exports.suggestions = suggestions;
const request = async (req, res, next) => {
    try {
        const requesterId = (0, requestHelpers_1.getAuthenticatedUserId)(req);
        const { receiverId, skillId, message } = req.body;
        if (typeof receiverId !== "string" || receiverId.trim().length === 0) {
            throw new httpError_1.HttpError(400, "receiverId is required");
        }
        if (skillId !== undefined && skillId !== null && typeof skillId !== "string") {
            throw new httpError_1.HttpError(400, "skillId must be a string");
        }
        if (message !== undefined && message !== null && typeof message !== "string") {
            throw new httpError_1.HttpError(400, "message must be a string");
        }
        const match = await (0, matchService_1.requestMatch)({
            requesterId,
            receiverId,
            skillId,
            message
        });
        res.status(201).json({ match });
    }
    catch (error) {
        next(error);
    }
};
exports.request = request;
const mine = async (req, res, next) => {
    try {
        const userId = (0, requestHelpers_1.getAuthenticatedUserId)(req);
        const matches = await (0, matchService_1.getMyMatches)(userId);
        res.status(200).json({ matches });
    }
    catch (error) {
        next(error);
    }
};
exports.mine = mine;
const update = async (req, res, next) => {
    try {
        const userId = (0, requestHelpers_1.getAuthenticatedUserId)(req);
        const { id } = req.params;
        const { status } = req.body;
        if (typeof id !== "string" || id.trim().length === 0) {
            throw new httpError_1.HttpError(400, "id route parameter is required");
        }
        if (status !== client_1.MatchStatus.ACCEPTED &&
            status !== client_1.MatchStatus.REJECTED &&
            status !== client_1.MatchStatus.CANCELLED) {
            throw new httpError_1.HttpError(400, "status must be ACCEPTED, REJECTED, or CANCELLED");
        }
        const match = await (0, matchService_1.updateMatchStatus)(userId, id, status);
        res.status(200).json({ match });
    }
    catch (error) {
        next(error);
    }
};
exports.update = update;
//# sourceMappingURL=matchController.js.map