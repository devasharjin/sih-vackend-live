import {
  getCookieOptions,
  setAuthCookies,
  clearAuthCookies,
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from "../utils/cookie.utils";
import {
  generateAuthTokens,
  verifyAccessToken,
  verifyRefreshToken,
  AccessTokenPayload,
} from "../utils/jwt.utils";
import { UserRole } from "../models/auth/user.model";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string, expected?: any, actual?: any) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    if (expected !== undefined || actual !== undefined) {
      console.error(`   Expected: ${expected}`);
      console.error(`   Actual:   ${actual}`);
    }
    failedCount++;
  }
}

async function runAuthTokenTests() {
  console.log("=== RUNNING POST-DEPLOYMENT AUTH TOKENS & COOKIES TEST SUITE ===\n");

  // 1. Test Cookie Options in Production / Cross-Site mode
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercel = process.env.VERCEL;

  try {
    process.env.NODE_ENV = "production";
    delete process.env.VERCEL;

    const prodOptions = getCookieOptions();
    assert(
      prodOptions.sameSite === "none",
      "Production cookies must have sameSite: 'none' for cross-site requests",
      "none",
      prodOptions.sameSite
    );
    assert(
      prodOptions.secure === true,
      "Production cookies must have secure: true",
      true,
      prodOptions.secure
    );
    assert(
      prodOptions.httpOnly === true,
      "Cookies must be httpOnly",
      true,
      prodOptions.httpOnly
    );
    assert(
      prodOptions.path === "/",
      "Cookies must have path: '/'",
      "/",
      prodOptions.path
    );

    // 2. Test Vercel environment flag
    process.env.NODE_ENV = "development";
    process.env.VERCEL = "1";

    const vercelOptions = getCookieOptions();
    assert(
      vercelOptions.sameSite === "none",
      "Vercel deployment cookies must have sameSite: 'none'",
      "none",
      vercelOptions.sameSite
    );
    assert(
      vercelOptions.secure === true,
      "Vercel deployment cookies must have secure: true",
      true,
      vercelOptions.secure
    );

    // 3. Test Local Development mode (plain HTTP)
    delete process.env.VERCEL;
    process.env.NODE_ENV = "development";

    const devOptions = getCookieOptions();
    assert(
      devOptions.sameSite === "lax",
      "Local development cookies use sameSite: 'lax'",
      "lax",
      devOptions.sameSite
    );
    assert(
      devOptions.secure === false,
      "Local development cookies use secure: false for http://localhost",
      false,
      devOptions.secure
    );

    // 4. Test setAuthCookies helper on mock Response
    const mockCookiesSet: Record<string, { val: string; options: any }> = {};
    const mockRes: any = {
      cookie: (name: string, val: string, options: any) => {
        mockCookiesSet[name] = { val, options };
      },
      clearCookie: (name: string, options: any) => {
        delete mockCookiesSet[name];
      },
    };

    setAuthCookies(mockRes, {
      accessToken: "mock.access.token",
      refreshToken: "mock.refresh.token",
    });

    assert(
      mockCookiesSet[ACCESS_TOKEN_COOKIE_NAME]?.val === "mock.access.token",
      "setAuthCookies sets accessToken cookie",
      "mock.access.token",
      mockCookiesSet[ACCESS_TOKEN_COOKIE_NAME]?.val
    );
    assert(
      mockCookiesSet[ACCESS_TOKEN_COOKIE_NAME]?.options.maxAge === ACCESS_TOKEN_MAX_AGE,
      "accessToken cookie has 15min maxAge",
      ACCESS_TOKEN_MAX_AGE,
      mockCookiesSet[ACCESS_TOKEN_COOKIE_NAME]?.options.maxAge
    );
    assert(
      mockCookiesSet[REFRESH_TOKEN_COOKIE_NAME]?.val === "mock.refresh.token",
      "setAuthCookies sets refreshToken cookie",
      "mock.refresh.token",
      mockCookiesSet[REFRESH_TOKEN_COOKIE_NAME]?.val
    );
    assert(
      mockCookiesSet[REFRESH_TOKEN_COOKIE_NAME]?.options.maxAge === REFRESH_TOKEN_MAX_AGE,
      "refreshToken cookie has 7d maxAge",
      REFRESH_TOKEN_MAX_AGE,
      mockCookiesSet[REFRESH_TOKEN_COOKIE_NAME]?.options.maxAge
    );

    // 5. Test clearAuthCookies helper
    let clearedCount = 0;
    const mockClearRes: any = {
      clearCookie: (name: string, options: any) => {
        clearedCount++;
        assert(options.path === "/", `clearCookie for ${name} specifies path: '/'`);
      },
    };
    clearAuthCookies(mockClearRes);
    assert(clearedCount === 2, "clearAuthCookies cleared both cookies", 2, clearedCount);

    // 6. Test JWT token generation and verification
    const testUser = {
      _id: "60d5ec49f1b2c8b1f8e4e1a1",
      email: "worker@example.com",
      role: [UserRole.WORKER],
    };

    const tokens = generateAuthTokens(testUser);
    assert(Boolean(tokens.accessToken), "generateAuthTokens generates accessToken");
    assert(Boolean(tokens.refreshToken), "generateAuthTokens generates refreshToken");

    const decodedAccess = verifyAccessToken<AccessTokenPayload>(tokens.accessToken);
    assert(
      decodedAccess.userId === "60d5ec49f1b2c8b1f8e4e1a1",
      "Decoded access token contains correct userId",
      "60d5ec49f1b2c8b1f8e4e1a1",
      decodedAccess.userId
    );
    assert(
      decodedAccess.id === "60d5ec49f1b2c8b1f8e4e1a1",
      "Decoded access token contains id alias",
      "60d5ec49f1b2c8b1f8e4e1a1",
      decodedAccess.id
    );
    assert(
      decodedAccess.email === "worker@example.com",
      "Decoded access token contains correct email",
      "worker@example.com",
      decodedAccess.email
    );

    const decodedRefresh = verifyRefreshToken<{ userId: string; id?: string }>(tokens.refreshToken);
    assert(
      decodedRefresh.userId === "60d5ec49f1b2c8b1f8e4e1a1",
      "Decoded refresh token contains correct userId",
      "60d5ec49f1b2c8b1f8e4e1a1",
      decodedRefresh.userId
    );
    assert(
      decodedRefresh.id === "60d5ec49f1b2c8b1f8e4e1a1",
      "Decoded refresh token contains id alias",
      "60d5ec49f1b2c8b1f8e4e1a1",
      decodedRefresh.id
    );

  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVercel !== undefined) {
      process.env.VERCEL = originalVercel;
    } else {
      delete process.env.VERCEL;
    }
  }

  console.log(`\n=== RESULTS: ${passedCount} PASSED, ${failedCount} FAILED ===\n`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

runAuthTokenTests();
