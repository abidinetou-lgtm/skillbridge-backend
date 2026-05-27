import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError";
import { prisma } from "../utils/prisma";

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user) throw new HttpError(401, "Authentication required");
  return req.user.id;
};

export const getCreditController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
try {
    // 1 — récupérer userId
    const userId = getAuthenticatedUserId(req);

    // 2 — interroger Prisma avec userId
    const user = await prisma.user.findUnique({
        where: { id: userId },   // ← userId ici, pas req.user?.id
        select: { credits: true }
    });

    // 3 — vérifier que l'user existe
    if (!user) throw new HttpError(404, "User not found");

    // 4 — retourner les crédits
    res.status(200).json({ credits: user.credits });

} catch (error) {
    next(error);
}
};