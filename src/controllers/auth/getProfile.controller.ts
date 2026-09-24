import { Request, Response } from "express";
import User, { UserRole } from "../../models/auth/user.model";
import Worker from "../../models/auth/worker.model";
import Cooperative from "../../models/auth/cooperative.model";
import { fail, ok } from "../../shared/envelope";

export async function getProfile(req: Request, res: Response) {
  // 1. Verify user payload from auth middleware
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = (req.user as any).userId || (req.user as any).id;

  // 2. Fetch base user document
  const user = await User.findById(userId);
  if (!user) {
    return fail(res, "User not found", null, 404);
  }

  let worker: any = null;
  let cooperative: any = null;

  // 3. Fetch role-specific profile details with lean projections
  if (user.role.includes(UserRole.WORKER) || user.role.includes(UserRole.CUSTOMER)) {
    const workerDoc: any = await Worker.findOne({ userId })
      .populate("cooperativeId", "cooperativeName cooperativeAddress cooperativePhone cooperativeEmail")
      .populate("category", "name icon slug description")
      .populate("categories", "name icon slug description")
      .populate("skills", "name description priceType hourlyPrice metersPrice")
      .lean();

    if (workerDoc) {
      // Prevent multi-megabyte base64 strings from bloating the auth payload
      if (workerDoc.verificationDocuments) {
        if (workerDoc.verificationDocuments.identity?.url?.startsWith("data:")) {
          workerDoc.verificationDocuments.identity.url = "data_document_uploaded";
        }
        if (workerDoc.verificationDocuments.certificate?.url?.startsWith("data:")) {
          workerDoc.verificationDocuments.certificate.url = "data_document_uploaded";
        }
      }
      worker = workerDoc;
    }
  }

  if (user.role.includes(UserRole.COOPERATIVE)) {
    const coopDoc: any = await Cooperative.findOne({ userId }).lean();
    if (coopDoc) {
      if (coopDoc.cooperativeLogo?.url?.startsWith("data:")) {
        coopDoc.cooperativeLogo.url = "data_logo_uploaded";
      }
      if (coopDoc.verificationCertificate?.url?.startsWith("data:")) {
        coopDoc.verificationCertificate.url = "data_certificate_uploaded";
      }
      cooperative = coopDoc;
    }
  }

  const profile = worker || cooperative || null;

  return ok(
    res,
    {
      user,
      worker,
      cooperative,
      profile,
    },
    "User profile retrieved successfully"
  );
}
