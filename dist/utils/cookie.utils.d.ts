import { CookieOptions, Response } from "express";
/**
 * Returns true if running in production or on Vercel deployment
 */
export declare const isProduction: () => boolean;
/**
 * Standard cookie configuration for authentication tokens.
 *
 * In cross-site production deployments (e.g. Frontend on fairgigs-*.vercel.app and Backend on *.vercel.app):
 * - sameSite must be "none" (required for cross-origin/cross-site cookie transmission)
 * - secure must be true (mandatory whenever sameSite is "none")
 *
 * In local development (HTTP localhost):
 * - sameSite: "lax"
 * - secure: false (browsers reject secure=true over plain http://localhost)
 */
export declare const getCookieOptions: (customOptions?: Partial<CookieOptions>) => CookieOptions;
export declare const ACCESS_TOKEN_COOKIE_NAME = "accessToken";
export declare const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
export declare const ACCESS_TOKEN_MAX_AGE: number;
export declare const REFRESH_TOKEN_MAX_AGE: number;
/**
 * Set both Access Token and Refresh Token HTTP-only cookies on the response
 */
export declare const setAuthCookies: (res: Response, tokens: {
    accessToken: string;
    refreshToken: string;
}) => void;
/**
 * Clear both Access Token and Refresh Token cookies with matching flags
 */
export declare const clearAuthCookies: (res: Response) => void;
//# sourceMappingURL=cookie.utils.d.ts.map