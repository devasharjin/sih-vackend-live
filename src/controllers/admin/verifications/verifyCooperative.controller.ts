import { Request, Response } from "express";
import mongoose from "mongoose";
import Cooperative from "../../../models/auth/cooperative.model";
import { VerificationStatus } from "../../../models/auth/worker.model";
import { fail, ok } from "../../../shared/envelope";

/**
 * Approve, reject, or reset a cooperative registration
 */
export async function verifyAdminCooperative(req: Request, res: Response) {
  const id = String(req.params.id);
  const { action, rejectionReason } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid cooperative ID", null, 400);
  }

  if (action !== "APPROVE" && action !== "REJECT" && action !== "PENDING") {
    return fail(
      res,
      "Invalid action. Action must be 'APPROVE', 'REJECT', or 'PENDING'",
      null,
      400
    );
  }

  const cooperative = await Cooperative.findById(id);
  if (!cooperative) {
    return fail(res, "Cooperative not found", null, 404);
  }

  if (action === "APPROVE") {
    cooperative.verificationStatus = VerificationStatus.APPROVED;
    cooperative.rejectedReason = undefined;
    await cooperative.save();

    const populated = await Cooperative.findById(cooperative._id).populate(
      "userId",
      "name email phone profilePicture accountStatus createdAt"
    );

    return ok(
      res,
      populated,
      `Cooperative "${cooperative.cooperativeName}" has been successfully approved.`
    );
  } else if (action === "REJECT") {
    const reason =
      rejectionReason?.trim() ||
      "Verification documents or society credentials did not meet compliance requirements.";

    cooperative.verificationStatus = VerificationStatus.REJECTED;
    cooperative.rejectedReason = reason;
    await cooperative.save();

    const populated = await Cooperative.findById(cooperative._id).populate(
      "userId",
      "name email phone profilePicture accountStatus createdAt"
    );

    return ok(
      res,
      populated,
      `Cooperative "${cooperative.cooperativeName}" registration has been rejected.`
    );
  } else {
    // Revert to PENDING
    cooperative.verificationStatus = VerificationStatus.PENDING;
    cooperative.rejectedReason = undefined;
    await cooperative.save();

    const populated = await Cooperative.findById(cooperative._id).populate(
      "userId",
      "name email phone profilePicture accountStatus createdAt"
    );

    return ok(
      res,
      populated,
      `Cooperative "${cooperative.cooperativeName}" status reverted to pending.`
    );
  }
}
