import jwt = require("jsonwebtoken");
import { Role } from "@prisma/client";
import { env } from "./env";

export interface JwtPayload {
  userId: string;
  role: Role;
}

export const generateToken = (payload: JwtPayload): string => {
  const options: jwt.SignOptions = {
    algorithm: "HS256",
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"]
  };

  // The token contains only safe identity data, never the password hash.
  return jwt.sign(payload, env.jwtSecret, options);
};

export const verifyToken = (token: string): JwtPayload => {
  // jsonwebtoken throws when the token is expired, malformed, or signed with the wrong secret.
  return jwt.verify(token, env.jwtSecret, {
    algorithms: ["HS256"]
  }) as JwtPayload;
};
