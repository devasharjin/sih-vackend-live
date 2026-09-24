import { Request, Response, NextFunction } from "express";
import { fail } from "../shared/envelope";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Sliding window rate limiter for voice assistant endpoints
 * Defaults to 40 requests per minute per IP / authenticated user
 */
export function voiceRateLimiter(
  maxRequests: number = 40,
  windowMs: number = 60 * 1000
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userIdentifier =
      (req.user as any)?.userId ||
      (req.user as any)?._id ||
      req.ip ||
      req.headers["x-forwarded-for"] ||
      "anonymous";

    const key = `voice_ratelimit_${String(userIdentifier)}`;
    const now = Date.now();

    let record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitMap.set(key, record);
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfterSec);
      return fail(
        res,
        `Too many voice requests. Please wait ${retryAfterSec} seconds before trying again.`,
        { retryAfter: retryAfterSec },
        429
      );
    }

    record.count += 1;
    return next();
  };
}
