import { UserRole } from "../models/auth/user.model";
export interface AccessTokenPayload {
    userId: string;
    id?: string;
    email: string;
    role: UserRole[] | string[] | UserRole | string;
}
export interface RefreshTokenPayload {
    userId: string;
    id?: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
/**
 * Generate a short-lived Access Token
 */
export declare function generateAccessToken(payload: AccessTokenPayload): string;
/**
 * Generate a long-lived Refresh Token
 */
export declare function generateRefreshToken(payload: RefreshTokenPayload): string;
/**
 * Helper to generate both Access Token and Refresh Token for a user
 */
export declare function generateAuthTokens(user: {
    _id: any;
    email: string;
    role: UserRole[] | string[] | UserRole | string;
}): AuthTokens;
/**
 * Verify an Access Token
 */
export declare function verifyAccessToken<T = AccessTokenPayload>(token: string): T;
/**
 * Verify a Refresh Token
 */
export declare function verifyRefreshToken<T = RefreshTokenPayload>(token: string): T;
//# sourceMappingURL=jwt.utils.d.ts.map