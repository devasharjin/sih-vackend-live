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
exports.userRegister = userRegister;
const envelope_1 = require("../../../shared/envelope");
const user_model_1 = __importStar(require("../../../models/auth/user.model"));
const password_1 = require("../../../utils/password");
const jwt_utils_1 = require("../../../utils/jwt.utils");
const cookie_utils_1 = require("../../../utils/cookie.utils");
async function userRegister(req, res) {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
        return (0, envelope_1.fail)(res, "Missing required fields", null, 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return (0, envelope_1.fail)(res, "Invalid email format", null, 400);
    }
    if (typeof phone !== "string" || !phone.trim()) {
        return (0, envelope_1.fail)(res, "Phone number is required", null, 400);
    }
    if (password.length < 8) {
        return (0, envelope_1.fail)(res, "Password must be at least 8 characters long", null, 400);
    }
    const existingUser = await user_model_1.default.findOne({ email });
    if (existingUser) {
        return (0, envelope_1.fail)(res, "User already exists", null, 400);
    }
    const hashedPassword = await (0, password_1.hashPassword)(password);
    const customer = await user_model_1.default.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: hashedPassword,
        role: [user_model_1.UserRole.CUSTOMER],
    });
    const tokens = (0, jwt_utils_1.generateAuthTokens)(customer);
    // Set HTTP-Only Cookies (supports cross-site production deployments)
    (0, cookie_utils_1.setAuthCookies)(res, tokens);
    const userResponse = {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        accountStatus: customer.accountStatus,
        profilePicture: customer.profilePicture,
    };
    return (0, envelope_1.ok)(res, {
        user: userResponse,
        tokens,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    }, "Customer registered successfully");
}
//# sourceMappingURL=userRegister.controller.js.map