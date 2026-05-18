import { NextFunction, Request, Response } from "express";
import { getCurrentUser, loginUser, registerUser } from "../services/authService";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName, bio } = req.body;

    // Keep basic validation close to the controller because it protects the HTTP boundary.
    if (
      !isNonEmptyString(email) ||
      !isNonEmptyString(password) ||
      !isNonEmptyString(firstName) ||
      !isNonEmptyString(lastName)
    ) {
      res.status(400).json({ message: "email, password, firstName, and lastName are required" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: "Password must be at least 8 characters long" });
      return;
    }

    const result = await registerUser({ email, password, firstName, lastName, bio });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      res.status(400).json({ message: "email and password are required" });
      return;
    }

    const result = await loginUser({ email, password });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const me = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const user = await getCurrentUser(req.user.id);

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
