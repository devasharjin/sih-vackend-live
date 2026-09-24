import { Request, Response } from "express";
import User, { AccountStatus } from "../../models/auth/user.model";
import { fail, ok } from "../../shared/envelope";
import { generateAuthTokens } from "../../utils/jwt.utils";
import { comparePassword } from "../../utils/password";
import { setAuthCookies } from "../../utils/cookie.utils";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  // 1. Validate required fields
  if (!email || !password) {
    return fail(res, "Email and password are required", null, 400);
  }

  // 2. Find user by email (include password field which has select: false)
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return fail(res, "Invalid email or password", null, 401);
  }

  // 3. Check account status and activity
  if (user.accountStatus === AccountStatus.SUSPEND || !user.isActive) {
    return fail(res, "Account is disabled or suspended", null, 403);
  }

  // 4. Compare passwords
  const isPasswordMatch = await comparePassword(password, user.password);
  if (!isPasswordMatch) {
    return fail(res, "Invalid email or password", null, 401);
  }

  // 5. Update last login timestamp
  user.lastLoginAt = new Date();
  await user.save();

  // 6. Generate authentication tokens
  const tokens = generateAuthTokens(user);

  // 7. Set HTTP-Only Cookies (supports cross-site production deployments)
  setAuthCookies(res, tokens);

  // 8. Return response payload without sensitive fields
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    accountStatus: user.accountStatus,
    profilePicture: user.profilePicture,
  };

  return ok(
    res,
    {
      user: userResponse,
      tokens,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
    "Login successful"
  );
}
