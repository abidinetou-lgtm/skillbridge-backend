import { Request } from "express";
import { HttpError } from "./httpError";

/**
 * Extracts the authenticated user's ID from the request.
 * Throws 401 if the middleware did not attach a user (should never happen
 * when the route is protected by `authenticate`, but guards against misuse).
 */
export const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user) throw new HttpError(401, "Authentication required");
  return req.user.id;
};