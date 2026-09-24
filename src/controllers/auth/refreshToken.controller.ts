import { Request, Response } from "express";
import User, { AccountStatus } from "../../models/auth/user.model";
import { fail, ok } from "../../shared/envelope";
import { generateAuthTokens, verifyRefreshToken } from "../../utils/jwt.utils";
import { setAuthCookies } from "../../utils/cookie.utils";

export async function refreshToken(req: Request, res: Response) {
  // 1. Retrieve refresh token from cookie, request body, or headers
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
  const tokenFromCustomHeader = req.headers["x-refresh-token"] as string | undefined;

  const token =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    tokenFromCustomHeader ||
    tokenFromHeader;

  if (!token) {
    return fail(res, "Refresh token is required", null, 401);
  }

  try {
    // 2. Verify the refresh token
    const decoded = verifyRefreshToken<{ userId?: string; id?: string }>(token);
    const userId = decoded?.userId || decoded?.id;
    if (!decoded || !userId) {
      return fail(res, "Invalid or expired refresh token", null, 401);
    }

    // 3. Find user and verify account status
    const user = await User.findById(userId);
    if (!user) {
      return fail(res, "User not found", null, 401);
    }

    if (user.accountStatus === AccountStatus.SUSPEND || !user.isActive) {
      return fail(res, "Account is disabled or suspended", null, 403);
    }

    // 4. Generate new token pair
    const tokens = generateAuthTokens(user);

    // 5. Update HTTP-Only Cookies (cross-site production compatible)
    setAuthCookies(res, tokens);

    // 6. Return tokens in payload for header/localStorage clients
    return ok(
      res,
      {
        tokens,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      "Token refreshed successfully"
    );
  } catch (error) {
    return fail(res, "Invalid or expired refresh token", null, 401);
  }
}
