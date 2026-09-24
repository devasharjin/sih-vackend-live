import { Request, Response, NextFunction } from "express";
/**
 * Sliding window rate limiter for voice assistant endpoints
 * Defaults to 40 requests per minute per IP / authenticated user
 */
export declare function voiceRateLimiter(maxRequests?: number, windowMs?: number): (req: Request, res: Response, next: NextFunction) => void | Response<{
    success: boolean;
    data: {
        retryAfter: number;
    } | null;
    message: string;
    status: number;
}, Record<string, any>>;
//# sourceMappingURL=voiceRateLimiter.d.ts.map