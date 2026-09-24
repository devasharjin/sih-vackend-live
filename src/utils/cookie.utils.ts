import { CookieOptions, Response } from "express";

/**
 * Returns true if running in production or on Vercel deployment
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production" || !!process.env.VERCEL;
};

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
export const getCookieOptions = (customOptions: Partial<CookieOptions> = {}): CookieOptions => {
  const prod = isProduction();

  return {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? ("none" as const) : ("lax" as const),
    path: "/",
    ...customOptions,
  };
};

export const ACCESS_TOKEN_COOKIE_NAME = "accessToken";
export const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

// 15 minutes in milliseconds
export const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
// 7 days in milliseconds
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Set both Access Token and Refresh Token HTTP-only cookies on the response
 */
export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
): void => {
  res.cookie(
    ACCESS_TOKEN_COOKIE_NAME,
    tokens.accessToken,
    getCookieOptions({ maxAge: ACCESS_TOKEN_MAX_AGE })
  );

  res.cookie(
    REFRESH_TOKEN_COOKIE_NAME,
    tokens.refreshToken,
    getCookieOptions({ maxAge: REFRESH_TOKEN_MAX_AGE })
  );
};

/**
 * Clear both Access Token and Refresh Token cookies with matching flags
 */
export const clearAuthCookies = (res: Response): void => {
  const options = getCookieOptions();
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, options);
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, options);
};
