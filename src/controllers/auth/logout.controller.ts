import { Request, Response } from "express";
import { ok } from "../../shared/envelope";

export async function logout(_req: Request, res: Response) {
  const isProd = process.env.NODE_ENV === "production";

  // Clear authentication cookies
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/",
  });

  return ok(res, null, "Logged out successfully");
}
