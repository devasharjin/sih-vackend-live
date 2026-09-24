import { Request, Response } from "express";
import mongoose from "mongoose";
import Cooperative from "../../../models/auth/cooperative.model";
import { fail, ok } from "../../../shared/envelope";

/**
 * Get single cooperative details for admin review
 */
export async function getAdminCooperativeById(req: Request, res: Response) {
  const id = String(req.params.id);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid cooperative ID", null, 400);
  }

  const cooperative = await Cooperative.findById(id)
    .populate(
      "userId",
      "name email phone profilePicture accountStatus createdAt"
    )
    .lean();

  if (!cooperative) {
    return fail(res, "Cooperative not found", null, 404);
  }

  return ok(res, cooperative, "Cooperative details retrieved successfully");
}
