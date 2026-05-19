"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMatch = exports.getMatchSuggestions = exports.getMyMatches = exports.requestMatch = void 0;
const client_1 = require("@prisma/client");
const matchService_1 = require("../services/matchService");
const httpError_1 = require("../utils/httpError");
const getAuthenticatedUserId = (req) => {
    if (!req.user) {
        throw new httpError_1.HttpError(401, "Authentication required");
    }
    return req.user.id;
};
const getRouteId = (req) => {
    const { id } = req.params;
    if (typeof id !== "string" || id.trim().length === 0) {
        throw new httpError_1.HttpError(400, "id route parameter is required");
    }
    return id;
};
const getNonEmptyString = (value) => {
    if (typeof value !== "string") {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};
const parseRequestBody = (body) => {
    if (!body || typeof body !== "object") {
        throw new httpError_1.HttpError(400, "Request body is required");
    }
    const data = body;
    const receiverId = getNonEmptyString(data.receiverId);
    if (!receiverId) {
        throw new httpError_1.HttpError(400, "receiverId is required");
    }
    // skillId and message are optional so the MVP can support generic match requests.
    return {
        receiverId,
        skillId: getNonEmptyString(data.skillId),
        message: getNonEmptyString(data.message)
    };
};
const parseStatusBody = (body) => {
    if (!body || typeof body !== "object") {
        throw new httpError_1.HttpError(400, "Request body is required");
    }
    const status = body.status;
    if (status !== client_1.MatchStatus.ACCEPTED && status !== client_1.MatchStatus.REJECTED) {
        throw new httpError_1.HttpError(400, "status must be ACCEPTED or REJECTED");
    }
    return { status };
};
const requestMatch = async (req, res, next) => {
    try {
        const requesterId = getAuthenticatedUserId(req);
        const input = parseRequestBody(req.body);
        const match = await (0, matchService_1.sendMatchRequest)(requesterId, input);
        res.status(201).json({ match });
    }
    catch (error) {
        next(error);
    }
};
exports.requestMatch = requestMatch;
const getMyMatches = async (req, res, next) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const matches = await (0, matchService_1.listMyMatches)(userId);
        res.status(200).json({ matches });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyMatches = getMyMatches;
const getMatchSuggestions = async (req, res, next) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const suggestions = await (0, matchService_1.listMatchSuggestions)(userId);
        res.status(200).json({ suggestions });
    }
    catch (error) {
        next(error);
    }
};
exports.getMatchSuggestions = getMatchSuggestions;
const updateMatch = async (req, res, next) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const matchId = getRouteId(req);
        const input = parseStatusBody(req.body);
        const match = await (0, matchService_1.updateMatchRequest)(userId, matchId, input);
        res.status(200).json({ match });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMatch = updateMatch;
//# sourceMappingURL=matchController.js.map