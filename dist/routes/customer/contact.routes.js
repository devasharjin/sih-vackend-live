"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/asyncHandler");
const contact_controller_1 = require("../../controllers/customer/contact.controller");
const jwt_utils_1 = require("../../utils/jwt.utils");
const router = (0, express_1.Router)();
// Optional authentication: extracts user if token is present, but doesn't block guests
function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const token = req.cookies?.accessToken || tokenFromHeader;
    if (token) {
        try {
            const decoded = (0, jwt_utils_1.verifyAccessToken)(token);
            if (decoded) {
                req.user = decoded;
            }
        }
        catch {
            // Ignore token errors for optional auth
        }
    }
    next();
}
// POST /api/customer/contact - Submit a contact message / support inquiry
router.post("/", optionalAuth, (0, asyncHandler_1.asyncHandler)(contact_controller_1.submitContactMessage));
exports.default = router;
//# sourceMappingURL=contact.routes.js.map