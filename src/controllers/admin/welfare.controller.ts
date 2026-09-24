import { Request, Response } from "express";
import mongoose from "mongoose";
import WelfareClaim, {
  WelfareClaimStatus,
  WelfareClaimType,
} from "../../models/welfareClaim.model";
import User from "../../models/auth/user.model";
import Cooperative from "../../models/auth/cooperative.model";
import { WelfareService, PLATFORM_WELFARE_POLICY } from "../../services/welfare.service";
import { fail, ok } from "../../shared/envelope";

/**
 * Get platform-wide insurance fund reserve health and claims metrics
 */
export async function getPlatformWelfareStats(_req: Request, res: Response) {
  const stats = await WelfareService.getPlatformWelfareMetrics();
  return ok(res, stats, "Platform welfare & insurance statistics retrieved successfully");
}

/**
 * Get all claims across the platform with filtering, search, and pagination
 */
export async function getAdminClaims(req: Request, res: Response) {
  const {
    status,
    claimType,
    cooperativeId,
    search,
    page = "1",
    limit = "20",
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const query: Record<string, any> = {};

  if (status && status !== "ALL" && Object.values(WelfareClaimStatus).includes(status as WelfareClaimStatus)) {
    query.status = status;
  }

  if (claimType && claimType !== "ALL" && Object.values(WelfareClaimType).includes(claimType as WelfareClaimType)) {
    query.claimType = claimType;
  }

  if (cooperativeId && mongoose.Types.ObjectId.isValid(cooperativeId as string)) {
    query.cooperative = new mongoose.Types.ObjectId(cooperativeId as string);
  }

  if (search && typeof search === "string" && search.trim()) {
    const s = search.trim();
    const regex = new RegExp(s, "i");

    const [matchingUsers, matchingCoops] = await Promise.all([
      User.find({ name: regex }).select("_id").lean(),
      Cooperative.find({ cooperativeName: regex }).select("_id").lean(),
    ]);

    const matchingUserIds = matchingUsers.map((u) => u._id);
    const matchingCoopIds = matchingCoops.map((c) => c._id);

    query.$or = [
      { claimNumber: regex },
      { title: regex },
      ...(matchingUserIds.length > 0 ? [{ workerUser: { $in: matchingUserIds } }] : []),
      ...(matchingCoopIds.length > 0 ? [{ cooperative: { $in: matchingCoopIds } }] : []),
    ];
  }

  const [claims, total] = await Promise.all([
    WelfareClaim.find(query)
      .populate("workerUser", "name phone email profilePicture")
      .populate("cooperative", "cooperativeName cooperativeEmail cooperativePhone")
      .populate("booking", "bookingNumber scheduledDate totalAmount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    WelfareClaim.countDocuments(query),
  ]);

  return ok(
    res,
    {
      claims,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
    "Platform claims retrieved successfully"
  );
}

/**
 * Super Admin audit / override action on a claim
 */
export async function auditAdminClaim(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid claim ID", null, 400);
  }

  const claim = await WelfareClaim.findById(id);
  if (!claim) {
    return fail(res, "Claim not found", null, 404);
  }

  const { auditAction, notes, newStatus, overrideAmountApproved } = req.body;

  if (!notes || !notes.trim()) {
    return fail(res, "Audit notes are required", null, 400);
  }

  const adminUser = await User.findById(userId).select("name");

  if (newStatus && Object.values(WelfareClaimStatus).includes(newStatus)) {
    claim.status = newStatus;
  }

  if (overrideAmountApproved !== undefined) {
    const override = Number(overrideAmountApproved);
    if (!isNaN(override) && override >= 0) {
      claim.amountApproved = override;
    }
  }

  claim.auditLog.push({
    action: auditAction || "SUPERADMIN_AUDIT_REVIEW",
    performedBy: userId,
    performedByName: adminUser?.name || "Platform Super Administrator",
    performedByRole: "SUPERADMIN",
    timestamp: new Date(),
    notes: notes.trim(),
  });

  await claim.save();

  return ok(res, claim, "Claim audit review logged successfully");
}

/**
 * Get Welfare & Insurance policy configuration
 */
export async function getPlatformWelfarePolicyConfig(_req: Request, res: Response) {
  return ok(res, PLATFORM_WELFARE_POLICY, "Platform policy configuration retrieved successfully");
}
