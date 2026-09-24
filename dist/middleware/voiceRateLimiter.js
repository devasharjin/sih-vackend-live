"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceRateLimiter = voiceRateLimiter;
const envelope_1 = require("../shared/envelope");
const rateLimitMap = new Map();
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
function voiceRateLimiter(maxRequests = 40, windowMs = 60 * 1000) {
    return (req, res, next) => {
        const userIdentifier = req.user?.userId ||
            req.user?._id ||
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
            return (0, envelope_1.fail)(res, `Too many voice requests. Please wait ${retryAfterSec} seconds before trying again.`, { retryAfter: retryAfterSec }, 429);
        }
        record.count += 1;
        return next();
    };
}
//# sourceMappingURL=voiceRateLimiter.js.map