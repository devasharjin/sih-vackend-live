import { NextFunction, Request, Response } from "express";
import { UserRole } from "../models/auth/user.model";
import { fail } from "../shared/envelope";
import { verifyAccessToken, AccessTokenPayload } from "../utils/jwt.utils";

type Role = UserRole | string;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Extract token: Prioritize Authorization Bearer header, fallback to HTTP-Only cookie
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
  const token = tokenFromHeader || req.cookies?.accessToken;

  if (!token) {
    return fail(res, "Unauthorized", null, 401);
  }

  try {
    const decoded = verifyAccessToken<AccessTokenPayload>(token);
    if (!decoded) {
      return fail(res, "Invalid or expired token", null, 401);
    }
    req.user = decoded;
    next();
  } catch (error) {
    return fail(res, "Invalid or expired token", null, 401);
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || typeof req.user === "string") {
      return fail(res, "Forbidden: User not authenticated", null, 403);
    }

    const userRoles = Array.isArray(req.user.role)
      ? req.user.role
      : typeof req.user.role === "string"
        ? [req.user.role]
        : [];

    const hasPermission = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasPermission) {
      return fail(res, "Forbidden: Insufficient privileges", null, 403);
    }

    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
  const token = tokenFromHeader || req.cookies?.accessToken;

  if (token) {
    try {
      const decoded = verifyAccessToken<AccessTokenPayload>(token);
      if (decoded) {
        req.user = decoded;
      }
    } catch {
      // Ignore invalid token in optional auth
    }
  }
  next();
}
