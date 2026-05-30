import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError";
import { prisma } from "../utils/prisma";
import { getAuthenticatedUserId } from "../utils/requestHelpers";

export const getCreditController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) throw new HttpError(404, "User not found");

    res.status(200).json({ credits: user.credits });
  } catch (error) {
    next(error);
  }
};