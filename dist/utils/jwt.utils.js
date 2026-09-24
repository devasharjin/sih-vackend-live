"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.generateAuthTokens = generateAuthTokens;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../config/jwt.config");
/**
 * Generate a short-lived Access Token
 */
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, jwt_config_1.jwtConfig.secret, {
        expiresIn: jwt_config_1.jwtConfig.accessExpiresIn,
    });
}
/**
 * Generate a long-lived Refresh Token
 */
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, jwt_config_1.jwtConfig.refreshSecret, {
        expiresIn: jwt_config_1.jwtConfig.refreshExpiresIn,
    });
}
/**
 * Helper to generate both Access Token and Refresh Token for a user
 */
function generateAuthTokens(user) {
    const userId = user._id.toString();
    const accessToken = generateAccessToken({
        userId,
        id: userId,
        email: user.email,
        role: user.role,
    });
    const refreshToken = generateRefreshToken({
        userId,
        id: userId,
    });
    return { accessToken, refreshToken };
}
/**
 * Verify an Access Token
 */
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, jwt_config_1.jwtConfig.secret);
}
/**
 * Verify a Refresh Token
 */
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, jwt_config_1.jwtConfig.refreshSecret);
}
//# sourceMappingURL=jwt.utils.js.map