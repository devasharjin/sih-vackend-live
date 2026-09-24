"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuthCookies = exports.setAuthCookies = exports.REFRESH_TOKEN_MAX_AGE = exports.ACCESS_TOKEN_MAX_AGE = exports.REFRESH_TOKEN_COOKIE_NAME = exports.ACCESS_TOKEN_COOKIE_NAME = exports.getCookieOptions = exports.isProduction = void 0;
/**
 * Returns true if running in production or on Vercel deployment
 */
const isProduction = () => {
    return process.env.NODE_ENV === "production" || !!process.env.VERCEL;
};
exports.isProduction = isProduction;
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
const getCookieOptions = (customOptions = {}) => {
    const prod = (0, exports.isProduction)();
    return {
        httpOnly: true,
        secure: prod,
        sameSite: prod ? "none" : "lax",
        path: "/",
        ...customOptions,
    };
};
exports.getCookieOptions = getCookieOptions;
exports.ACCESS_TOKEN_COOKIE_NAME = "accessToken";
exports.REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
// 15 minutes in milliseconds
exports.ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
// 7 days in milliseconds
exports.REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
/**
 * Set both Access Token and Refresh Token HTTP-only cookies on the response
 */
const setAuthCookies = (res, tokens) => {
    res.cookie(exports.ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, (0, exports.getCookieOptions)({ maxAge: exports.ACCESS_TOKEN_MAX_AGE }));
    res.cookie(exports.REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, (0, exports.getCookieOptions)({ maxAge: exports.REFRESH_TOKEN_MAX_AGE }));
};
exports.setAuthCookies = setAuthCookies;
/**
 * Clear both Access Token and Refresh Token cookies with matching flags
 */
const clearAuthCookies = (res) => {
    const options = (0, exports.getCookieOptions)();
    res.clearCookie(exports.ACCESS_TOKEN_COOKIE_NAME, options);
    res.clearCookie(exports.REFRESH_TOKEN_COOKIE_NAME, options);
};
exports.clearAuthCookies = clearAuthCookies;
//# sourceMappingURL=cookie.utils.js.map