import { NextFunction, Request, Response } from "express";
import {
  addLearningGoal,
  addUserSkill,
  removeLearningGoal,
  removeUserSkill,
  searchUsers,
  updateUserProfile
} from "../services/userService";
import { HttpError } from "../utils/httpError";
import {
  parseLearningGoalInput,
  parseSkillInput,
  parseUpdateProfileInput
} from "../utils/profileValidation";

export const getAuthenticatedUserId = (req: Request): string => {
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

export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const input = parseUpdateProfileInput(req.body);
    const user = await updateUserProfile(userId, input);

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const createSkill = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const input = parseSkillInput(req.body);
    const userSkill = await addUserSkill(userId, input);

    res.status(201).json({ skill: userSkill });
  } catch (error) {
    next(error);
  }
};

export const deleteSkill = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    // The id here is the UserSkill row id, so users can only delete their own join record.
    await removeUserSkill(userId, getRouteId(req));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const createLearningGoal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const input = parseLearningGoalInput(req.body);
    const learningGoal = await addLearningGoal(userId, input);

    res.status(201).json({ learningGoal });
  } catch (error) {
    next(error);
  }
};

export const deleteLearningGoal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    await removeLearningGoal(userId, getRouteId(req));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const search = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;

    if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
      throw new HttpError(400, "limit must be a positive integer");
    }

    const users = await searchUsers({
      query: typeof req.query.q === "string" ? req.query.q : undefined,
      skill: typeof req.query.skill === "string" ? req.query.skill : undefined,
      limit
    });

    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};
