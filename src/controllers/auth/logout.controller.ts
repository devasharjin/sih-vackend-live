import { Request, Response } from "express";
import { ok } from "../../shared/envelope";
import { clearAuthCookies } from "../../utils/cookie.utils";

export async function logout(_req: Request, res: Response) {
  // Clear authentication cookies with matching options
  clearAuthCookies(res);

  return ok(res, null, "Logged out successfully");
}
