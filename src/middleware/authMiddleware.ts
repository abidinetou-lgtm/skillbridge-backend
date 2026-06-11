import { NextFunction, Request, Response } from "express";
import { Role, UserStatus } from "@prisma/client";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../utils/prisma";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authorization token is required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        role: true,
        status: true,
        isEmailVerified: true
      }
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    if (!user.isEmailVerified) {
      res.status(403).json({ message: "Please verify your email address before signing in." });
      return;
    }

    // Store the verified identity on the request for controllers that need the current user.
    req.user = {
      id: user.id,
      role: user.role
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorizeRoles =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "You do not have permission to access this resource" });
      return;
    }

    next();
  };
