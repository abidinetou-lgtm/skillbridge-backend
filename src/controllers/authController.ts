import { NextFunction, Request, Response } from "express";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  resendUserVerificationEmail,
  verifyUserEmail
} from "../services/authService";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

interface ValidationError {
  field: string;
  message: string;
}

const sendValidationErrors = (
  res: Response,
  errors: ValidationError[]
): void => {
  res.status(400).json({
    message: "Validation failed",
    errors
  });
};

const validatePassword = (password: unknown): ValidationError[] => {
  if (!isNonEmptyString(password)) {
    return [{ field: "password", message: "Password is required" }];
  }

  const errors: ValidationError[] = [];

  if (password.length < 8) {
    errors.push({
      field: "password",
      message: "Password must be at least 8 characters long"
    });
  }

  if (password.length > 128) {
    errors.push({
      field: "password",
      message: "Password must be at most 128 characters long"
    });
  }

  return errors;
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName, bio } = req.body;
    const errors: ValidationError[] = [];

    if (!isNonEmptyString(email)) {
      errors.push({ field: "email", message: "Email is required" });
    } else if (!isValidEmail(email)) {
      errors.push({ field: "email", message: "Email must be valid" });
    }

    errors.push(...validatePassword(password));

    if (!isNonEmptyString(firstName)) {
      errors.push({ field: "firstName", message: "First name is required" });
    }

    if (!isNonEmptyString(lastName)) {
      errors.push({ field: "lastName", message: "Last name is required" });
    }

    if (errors.length > 0) {
      sendValidationErrors(res, errors);
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
    const errors: ValidationError[] = [];

    if (!isNonEmptyString(email)) {
      errors.push({ field: "email", message: "Email is required" });
    }

    if (!isNonEmptyString(password)) {
      errors.push({ field: "password", message: "Password is required" });
    }

    if (errors.length > 0) {
      sendValidationErrors(res, errors);
      return;
    }

    const result = await loginUser({ email, password });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.query;

    if (!isNonEmptyString(token)) {
      res.status(400).json({ message: "Verification token is required" });
      return;
    }

    const result = await verifyUserEmail(token);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!isNonEmptyString(email)) {
      res.status(400).json({ message: "email is required" });
      return;
    }

    const result = await resendUserVerificationEmail(email);

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

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const errors: ValidationError[] = [];

    if (!isNonEmptyString(email)) {
      errors.push({ field: "email", message: "Email is required" });
    } else if (!isValidEmail(email)) {
      errors.push({ field: "email", message: "Email must be valid" });
    }

    if (errors.length > 0) {
      sendValidationErrors(res, errors);
      return;
    }

    await requestPasswordReset(email);

    res.status(200).json({
      message: "If an account exists for this email, a reset link has been sent."
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body;
    const errors: ValidationError[] = [];

    if (!isNonEmptyString(token)) {
      errors.push({ field: "token", message: "Token is required" });
    }

    errors.push(...validatePassword(password));

    if (errors.length > 0) {
      sendValidationErrors(res, errors);
      return;
    }

    await resetPasswordService(token, password);

    res.status(200).json({
      message: "Password has been reset successfully"
    });
  } catch (error) {
    next(error);
  }
};
