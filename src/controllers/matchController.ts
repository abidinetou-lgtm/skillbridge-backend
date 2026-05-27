import { NextFunction, Request, Response } from "express";
import { MatchStatus } from "@prisma/client";
import {
  getMatchSuggestions,
  getMyMatches,
  requestMatch,
  updateMatchStatus
} from "../services/matchService";
import { HttpError } from "../utils/httpError";

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user) {
    throw new HttpError(401, "Authentication required");
  }

  return req.user.id;
};

export const suggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const matches = await getMatchSuggestions(userId);

    // Return a simple list for the MVP. More match metadata can be added later.
    res.status(200).json({ suggestions: matches });
  } catch (error) {
    next(error);
  }
};

export const request = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requesterId = getAuthenticatedUserId(req);
    const { receiverId, skillId, message } = req.body;

    if (typeof receiverId !== "string" || receiverId.trim().length === 0) {
      throw new HttpError(400, "receiverId is required");
    }

    if (skillId !== undefined && skillId !== null && typeof skillId !== "string") {
      throw new HttpError(400, "skillId must be a string");
    }

    if (message !== undefined && message !== null && typeof message !== "string") {
      throw new HttpError(400, "message must be a string");
    }

    const match = await requestMatch({
      requesterId,
      receiverId,
      skillId,
      message
    });

    res.status(201).json({ match });
  } catch (error) {
    next(error);
  }
};

export const mine = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const matches = await getMyMatches(userId);

    res.status(200).json({ matches });
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { id } = req.params;
    const { status } = req.body;

    if (typeof id !== "string" || id.trim().length === 0) {
      throw new HttpError(400, "id route parameter is required");
    }

    if (
      status !== MatchStatus.ACCEPTED &&
      status !== MatchStatus.REJECTED &&
      status !== MatchStatus.CANCELLED
    ) {
      throw new HttpError(400, "status must be ACCEPTED, REJECTED, or CANCELLED");
    }

    const match = await updateMatchStatus(userId, id, status);

    res.status(200).json({ match });
  } catch (error) {
    next(error);
  }
};
