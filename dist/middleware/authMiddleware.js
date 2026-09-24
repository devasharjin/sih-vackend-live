"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.optionalAuth = optionalAuth;
const envelope_1 = require("../shared/envelope");
const jwt_utils_1 = require("../utils/jwt.utils");
function requireAuth(req, res, next) {
    // Extract token: Prioritize Authorization Bearer header, fallback to HTTP-Only cookie
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const token = tokenFromHeader || req.cookies?.accessToken;
    if (!token) {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    try {
        const decoded = (0, jwt_utils_1.verifyAccessToken)(token);
        if (!decoded) {
            return (0, envelope_1.fail)(res, "Invalid or expired token", null, 401);
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        return (0, envelope_1.fail)(res, "Invalid or expired token", null, 401);
    }
}
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || typeof req.user === "string") {
            return (0, envelope_1.fail)(res, "Forbidden: User not authenticated", null, 403);
        }
        const userRoles = Array.isArray(req.user.role)
            ? req.user.role
            : typeof req.user.role === "string"
                ? [req.user.role]
                : [];
        const hasPermission = allowedRoles.some((role) => userRoles.includes(role));
        if (!hasPermission) {
            return (0, envelope_1.fail)(res, "Forbidden: Insufficient privileges", null, 403);
        }
        next();
    };
}
function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const token = tokenFromHeader || req.cookies?.accessToken;
    if (token) {
        try {
            const decoded = (0, jwt_utils_1.verifyAccessToken)(token);
            if (decoded) {
                req.user = decoded;
            }
        }
        catch {
            // Ignore invalid token in optional auth
        }
    }
    next();
}
//# sourceMappingURL=authMiddleware.js.map