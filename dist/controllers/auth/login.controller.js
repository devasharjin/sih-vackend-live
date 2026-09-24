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
exports.login = login;
const user_model_1 = __importStar(require("../../models/auth/user.model"));
const envelope_1 = require("../../shared/envelope");
const jwt_utils_1 = require("../../utils/jwt.utils");
const password_1 = require("../../utils/password");
const cookie_utils_1 = require("../../utils/cookie.utils");
async function login(req, res) {
    const { email, password } = req.body;
    // 1. Validate required fields
    if (!email || !password) {
        return (0, envelope_1.fail)(res, "Email and password are required", null, 400);
    }
    // 2. Find user by email (include password field which has select: false)
    const user = await user_model_1.default.findOne({ email }).select("+password");
    if (!user) {
        return (0, envelope_1.fail)(res, "Invalid email or password", null, 401);
    }
    // 3. Check account status and activity
    if (user.accountStatus === user_model_1.AccountStatus.SUSPEND || !user.isActive) {
        return (0, envelope_1.fail)(res, "Account is disabled or suspended", null, 403);
    }
    // 4. Compare passwords
    const isPasswordMatch = await (0, password_1.comparePassword)(password, user.password);
    if (!isPasswordMatch) {
        return (0, envelope_1.fail)(res, "Invalid email or password", null, 401);
    }
    // 5. Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();
    // 6. Generate authentication tokens
    const tokens = (0, jwt_utils_1.generateAuthTokens)(user);
    // 7. Set HTTP-Only Cookies (supports cross-site production deployments)
    (0, cookie_utils_1.setAuthCookies)(res, tokens);
    // 8. Return response payload without sensitive fields
    const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountStatus: user.accountStatus,
        profilePicture: user.profilePicture,
    };
    return (0, envelope_1.ok)(res, {
        user: userResponse,
        tokens,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    }, "Login successful");
}
//# sourceMappingURL=login.controller.js.map