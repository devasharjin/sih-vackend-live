import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { UserRole } from "../models/auth/user.model";
import { jwtConfig } from "../config/jwt.config";

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: UserRole[] | string[] | UserRole | string;
}

export interface RefreshTokenPayload {
  userId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate a short-lived Access Token
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, jwtConfig.secret as Secret, {
    expiresIn: jwtConfig.accessExpiresIn as SignOptions["expiresIn"],
  });
}

/**
 * Generate a long-lived Refresh Token
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, jwtConfig.refreshSecret as Secret, {
    expiresIn: jwtConfig.refreshExpiresIn as SignOptions["expiresIn"],
  });
}

/**
 * Helper to generate both Access Token and Refresh Token for a user
 */
export function generateAuthTokens(user: {
  _id: any;
  email: string;
  role: UserRole[] | string[] | UserRole | string;
}): AuthTokens {
  const userId = user._id.toString();

  const accessToken = generateAccessToken({
    userId,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId,
  });

  return { accessToken, refreshToken };
}

/**
 * Verify an Access Token
 */
export function verifyAccessToken<T = AccessTokenPayload>(token: string): T {
  return jwt.verify(token, jwtConfig.secret as Secret) as T;
}

/**
 * Verify a Refresh Token
 */
export function verifyRefreshToken<T = RefreshTokenPayload>(token: string): T {
  return jwt.verify(token, jwtConfig.refreshSecret as Secret) as T;
}
