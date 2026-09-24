"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = refreshToken;
const user_model_1 = __importStar(require("../../models/auth/user.model"));
const envelope_1 = require("../../shared/envelope");
const jwt_utils_1 = require("../../utils/jwt.utils");
const cookie_utils_1 = require("../../utils/cookie.utils");
async function refreshToken(req, res) {
    // 1. Retrieve refresh token from cookie, request body, or headers
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const tokenFromCustomHeader = req.headers["x-refresh-token"];
    const token = req.cookies?.refreshToken ||
        req.body?.refreshToken ||
        tokenFromCustomHeader ||
        tokenFromHeader;
    if (!token) {
        return (0, envelope_1.fail)(res, "Refresh token is required", null, 401);
    }
    try {
        // 2. Verify the refresh token
        const decoded = (0, jwt_utils_1.verifyRefreshToken)(token);
        const userId = decoded?.userId || decoded?.id;
        if (!decoded || !userId) {
            return (0, envelope_1.fail)(res, "Invalid or expired refresh token", null, 401);
        }
        // 3. Find user and verify account status
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return (0, envelope_1.fail)(res, "User not found", null, 401);
        }
        if (user.accountStatus === user_model_1.AccountStatus.SUSPEND || !user.isActive) {
            return (0, envelope_1.fail)(res, "Account is disabled or suspended", null, 403);
        }
        // 4. Generate new token pair
        const tokens = (0, jwt_utils_1.generateAuthTokens)(user);
        // 5. Update HTTP-Only Cookies (cross-site production compatible)
        (0, cookie_utils_1.setAuthCookies)(res, tokens);
        // 6. Return tokens in payload for header/localStorage clients
        return (0, envelope_1.ok)(res, {
            tokens,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        }, "Token refreshed successfully");
    }
    catch (error) {
        return (0, envelope_1.fail)(res, "Invalid or expired refresh token", null, 401);
    }
}
//# sourceMappingURL=refreshToken.controller.js.map