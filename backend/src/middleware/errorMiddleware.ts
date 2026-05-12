import { NextFunction, Request, Response } from "express";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the full error for developers, but send clients a generic message.
  console.error(err);

  if (
    err.message === "Email is already registered" ||
    err.message === "Invalid email or password" ||
    err.message === "User not found"
  ) {
    const statusCode = err.message === "Email is already registered" ? 409 : 401;

    res.status(statusCode).json({
      message: err.message
    });
    return;
  }

  res.status(500).json({
    message: "Internal server error"
  });
};
