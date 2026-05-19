import { MatchStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import {
  listMatchSuggestions,
  listMyMatches,
  sendMatchRequest,
  updateMatchRequest
} from "../services/matchService";
import { HttpError } from "../utils/httpError";

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user) {
    throw new HttpError(401, "Authentication required");
  }

  return req.user.id;
};

const getRouteId = (req: Request): string => {
  const { id } = req.params;

  if (typeof id !== "string" || id.trim().length === 0) {
    throw new HttpError(400, "id route parameter is required");
  }

  return id;
};

const getNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

const parseRequestBody = (body: unknown) => {
  if (!body || typeof body !== "object") {
    throw new HttpError(400, "Request body is required");
  }

  const data = body as Record<string, unknown>;
  const receiverId = getNonEmptyString(data.receiverId);

  if (!receiverId) {
    throw new HttpError(400, "receiverId is required");
  }

  // skillId and message are optional so the MVP can support generic match requests.
  return {
    receiverId,
    skillId: getNonEmptyString(data.skillId),
    message: getNonEmptyString(data.message)
  };
};

const parseStatusBody = (body: unknown) => {
  if (!body || typeof body !== "object") {
    throw new HttpError(400, "Request body is required");
  }

  const status = (body as Record<string, unknown>).status;

  if (status !== MatchStatus.ACCEPTED && status !== MatchStatus.REJECTED) {
    throw new HttpError(400, "status must be ACCEPTED or REJECTED");
  }

  return { status };
};

export const requestMatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requesterId = getAuthenticatedUserId(req);
    const input = parseRequestBody(req.body);
    const match = await sendMatchRequest(requesterId, input);

    res.status(201).json({ match });
  } catch (error) {
    next(error);
  }
};

export const getMyMatches = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const matches = await listMyMatches(userId);

    res.status(200).json({ matches });
  } catch (error) {
    next(error);
  }
};

export const getMatchSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const suggestions = await listMatchSuggestions(userId);

    res.status(200).json({ suggestions });
  } catch (error) {
    next(error);
  }
};

export const updateMatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const matchId = getRouteId(req);
    const input = parseStatusBody(req.body);
    const match = await updateMatchRequest(userId, matchId, input);

    res.status(200).json({ match });
  } catch (error) {
    next(error);
  }
};
