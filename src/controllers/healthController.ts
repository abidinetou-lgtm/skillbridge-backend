import { Request, Response } from "express";

export const getHealthCheck = (_req: Request, res: Response): void => {
  // Health checks help load balancers and uptime monitors confirm the API is alive.
  res.status(200).json({
    status: "ok",
    message: "API is healthy"
  });
};
