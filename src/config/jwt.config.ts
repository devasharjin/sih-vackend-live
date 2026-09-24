import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const jwtConfig = {
  secret: process.env.JWT_SECRET || "super_secret_cooperative_jwt_key_2026",
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    "super_secret_cooperative_refresh_key_2026",
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};
