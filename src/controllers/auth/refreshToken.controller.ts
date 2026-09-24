import { Request, Response } from "express";
import User, { AccountStatus } from "../../models/auth/user.model";
import { fail, ok } from "../../shared/envelope";
import { generateAuthTokens, verifyRefreshToken } from "../../utils/jwt.utils";

export async function refreshToken(req: Request, res: Response) {
  // 1. Retrieve refresh token from cookie or request body
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return fail(res, "Refresh token is required", null, 401);
  }

  try {
    // 2. Verify the refresh token
    const decoded = verifyRefreshToken<{ userId: string }>(token);
    if (!decoded || !decoded.userId) {
      return fail(res, "Invalid or expired refresh token", null, 401);
    }

    // 3. Find user and verify account status
    const user = await User.findById(decoded.userId);
    if (!user) {
      return fail(res, "User not found", null, 401);
    }

    if (user.accountStatus === AccountStatus.SUSPEND || !user.isActive) {
      return fail(res, "Account is disabled or suspended", null, 403);
    }

    // 4. Generate new token pair
    const tokens = generateAuthTokens(user);

    // 5. Update HTTP-Only Cookies
    const isProd = process.env.NODE_ENV === "production";

    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return ok(res, { tokens }, "Token refreshed successfully");
  } catch (error) {
    return fail(res, "Invalid or expired refresh token", null, 401);
  }
}
