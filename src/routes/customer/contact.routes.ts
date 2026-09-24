import { Router, Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../shared/asyncHandler";
import { submitContactMessage } from "../../controllers/customer/contact.controller";
import { verifyAccessToken, AccessTokenPayload } from "../../utils/jwt.utils";

const router = Router();

// Optional authentication: extracts user if token is present, but doesn't block guests
function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
  const token = req.cookies?.accessToken || tokenFromHeader;

  if (token) {
    try {
      const decoded = verifyAccessToken<AccessTokenPayload>(token);
      if (decoded) {
        req.user = decoded;
      }
    } catch {
      // Ignore token errors for optional auth
    }
  }
  next();
}

// POST /api/customer/contact - Submit a contact message / support inquiry
router.post("/", optionalAuth, asyncHandler(submitContactMessage));

export default router;
