"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ quiet: true });
exports.jwtConfig = {
    secret: process.env.JWT_SECRET || "super_secret_cooperative_jwt_key_2026",
    refreshSecret: process.env.JWT_REFRESH_SECRET ||
        "super_secret_cooperative_refresh_key_2026",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};
//# sourceMappingURL=jwt.config.js.map