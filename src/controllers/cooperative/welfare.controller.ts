import { Request, Response } from "express";
import mongoose from "mongoose";
import Cooperative from "../../models/auth/cooperative.model";
import Worker from "../../models/auth/worker.model";
import User from "../../models/auth/user.model";
import Booking, { BookingStatus } from "../../models/booking.model";
import WelfareClaim, {
  WelfareClaimStatus,
  WelfareClaimType,
  WelfareUrgency,
} from "../../models/welfareClaim.model";
import { WelfareService, PLATFORM_WELFARE_POLICY } from "../../services/welfare.service";
import { fail, ok } from "../../shared/envelope";

/**
 * Get cooperative welfare fund statistics and reserve health
 */
export async function getCooperativeWelfareStats(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const cooperative = await Cooperative.findOne({ userId });

  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  const stats = await WelfareService.getCooperativeWelfareMetrics(cooperative._id as mongoose.Types.ObjectId);

  return ok(
    res,
    {
      ...stats,
      cooperative: {
        id: cooperative._id,
        name: cooperative.cooperativeName,
      },
    },
    "Cooperative welfare statistics retrieved successfully"
  );
}

/**
 * Get all claims submitted by workers of this cooperative
 */
export async function getCooperativeClaims(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const cooperative = await Cooperative.findOne({ userId });

  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  const {
    status,
    claimType,
    urgency,
    search,
    page = "1",
    limit = "20",
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(50, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const query: Record<string, any> = { cooperative: cooperative._id };

  if (status && status !== "ALL" && Object.values(WelfareClaimStatus).includes(status as WelfareClaimStatus)) {
    query.status = status;
  }

  if (claimType && claimType !== "ALL" && Object.values(WelfareClaimType).includes(claimType as WelfareClaimType)) {
    query.claimType = claimType;
  }

  if (urgency && urgency !== "ALL" && Object.values(WelfareUrgency).includes(urgency as WelfareUrgency)) {
    query.urgency = urgency;
  }

  if (search && typeof search === "string" && search.trim()) {
    const s = search.trim();
    const regex = new RegExp(s, "i");

    const matchingUsers = await User.find({ name: regex }).select("_id").lean();
    const matchingUserIds = matchingUsers.map((u) => u._id);

    query.$or = [
      { claimNumber: regex },
      { title: regex },
      ...(matchingUserIds.length > 0 ? [{ workerUser: { $in: matchingUserIds } }] : []),
    ];
  }

  const [claims, total] = await Promise.all([
    WelfareClaim.find(query)
      .populate("workerUser", "name phone email profilePicture")
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
    "Cooperative claims retrieved successfully"
  );
}

/**
 * Update welfare claim status (UNDER_REVIEW, APPROVED, REJECTED, DISBURSED)
 */
export async function updateCooperativeClaimStatus(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const cooperative = await Cooperative.findOne({ userId });

  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid claim ID", null, 400);
  }

  const claim = await WelfareClaim.findOne({ _id: id, cooperative: cooperative._id });
  if (!claim) {
    return fail(res, "Claim not found in this cooperative", null, 404);
  }

  const { status, amountApproved, reviewNotes, rejectionReason, disbursementTxnId } = req.body;

  if (!status || !Object.values(WelfareClaimStatus).includes(status)) {
    return fail(res, "Valid claim status is required", null, 400);
  }

  const reviewerUser = await User.findById(userId).select("name");
  const reviewerName = reviewerUser?.name || "Cooperative Officer";

  // Validate state-specific transitions
  if (status === WelfareClaimStatus.APPROVED) {
    const approved = Number(amountApproved);
    if (isNaN(approved) || approved <= 0) {
      return fail(res, "Approved amount is required and must be greater than zero", null, 400);
    }
    claim.amountApproved = approved;
    claim.reviewNotes = reviewNotes || claim.reviewNotes;
  } else if (status === WelfareClaimStatus.REJECTED) {
    if (!rejectionReason || !rejectionReason.trim()) {
      return fail(res, "Reason for rejection is required", null, 400);
    }
    claim.rejectionReason = rejectionReason.trim();
    claim.reviewNotes = reviewNotes || claim.reviewNotes;
  } else if (status === WelfareClaimStatus.DISBURSED) {
    if (claim.status !== WelfareClaimStatus.APPROVED) {
      return fail(res, "Only approved claims can be marked as disbursed", null, 400);
    }
    claim.amountDisbursed = claim.amountApproved || claim.amountRequested;
    claim.disbursedAt = new Date();
    claim.disbursementTxnId = disbursementTxnId || `TXN-WLF-${Date.now()}`;
    claim.reviewNotes = reviewNotes || claim.reviewNotes;
  }

  claim.status = status;
  claim.auditLog.push({
    action: `STATUS_CHANGED_TO_${status}`,
    performedBy: userId,
    performedByName: reviewerName,
    performedByRole: "COOPERATIVE",
    timestamp: new Date(),
    notes: reviewNotes || rejectionReason || `Status updated to ${status}`,
  });

  await claim.save();

  return ok(res, claim, `Claim status successfully updated to ${status}`);
}

/**
 * Direct emergency relief grant issued by cooperative to a worker
 */
export async function issueEmergencyGrant(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const cooperative = await Cooperative.findOne({ userId });

  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  const { workerId, amount, reason, disbursementTxnId } = req.body;

  if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
    return fail(res, "Valid worker ID is required", null, 400);
  }

  const worker = await Worker.findOne({ _id: workerId, cooperativeId: cooperative._id });
  if (!worker) {
    return fail(res, "Worker not found in this cooperative", null, 404);
  }

  const grantAmount = Number(amount);
  const maxEmergencyLimit = PLATFORM_WELFARE_POLICY.coverage.emergencyHardshipMax;

  if (isNaN(grantAmount) || grantAmount < 100 || grantAmount > maxEmergencyLimit) {
    return fail(
      res,
      `Emergency grant amount must be between ₹100 and ₹${maxEmergencyLimit.toLocaleString("en-IN")}`,
      null,
      400
    );
  }

  if (!reason || !reason.trim()) {
    return fail(res, "Emergency justification reason is required", null, 400);
  }

  const adminUser = await User.findById(userId).select("name");

  // Create auto-approved and disbursed emergency claim
  const claim = await WelfareClaim.create({
    worker: worker._id,
    workerUser: worker.userId,
    cooperative: cooperative._id,
    claimType: WelfareClaimType.EMERGENCY_HARDSHIP,
    urgency: WelfareUrgency.CRITICAL,
    title: `Cooperative Emergency Grant: ${reason.trim().slice(0, 60)}`,
    description: reason.trim(),
    amountRequested: grantAmount,
    amountApproved: grantAmount,
    amountDisbursed: grantAmount,
    status: WelfareClaimStatus.DISBURSED,
    reviewNotes: "Directly issued by Cooperative Executive Committee",
    disbursedAt: new Date(),
    disbursementTxnId: disbursementTxnId || `GRNT-EMG-${Date.now()}`,
    disbursementMethod: "DIRECT_COOPERATIVE_STIPEND",
    auditLog: [
      {
        action: "DIRECT_EMERGENCY_GRANT_ISSUED",
        performedBy: userId,
        performedByName: adminUser?.name || "Cooperative Committee",
        performedByRole: "COOPERATIVE",
        timestamp: new Date(),
        notes: `Emergency grant of ₹${grantAmount} disbursed: ${reason.trim()}`,
      },
    ],
  });

  return ok(res, claim, "Emergency relief grant successfully issued and disbursed");
}

/**
 * Directory of cooperative workers with their insurance coverage details
 */
export async function getCooperativeWorkerWelfareList(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const cooperative = await Cooperative.findOne({ userId });

  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  const workers = await Worker.find({ cooperativeId: cooperative._id })
    .populate("userId", "name phone email profilePicture")
    .populate("category", "name icon slug")
    .lean();

  const workerIds = workers.map((w) => w._id);

  // Aggregate contributions per worker
  const bookingAggs = await Booking.aggregate([
    {
      $match: {
        worker: { $in: workerIds },
        status: BookingStatus.COMPLETED,
      },
    },
    {
      $group: {
        _id: "$worker",
        totalInsuranceAccrued: {
          $sum: {
            $ifNull: [
              "$pricing.insuranceShareAmount",
              { $multiply: ["$totalAmount", 0.05] },
            ],
          },
        },
        completedJobs: { $sum: 1 },
      },
    },
  ]);

  const contributionMap = new Map();
  bookingAggs.forEach((b) => {
    contributionMap.set(b._id.toString(), {
      totalInsuranceAccrued: Math.round(b.totalInsuranceAccrued * 100) / 100,
      completedJobs: b.completedJobs,
    });
  });

  const workerDirectory = workers.map((w) => {
    const stats = contributionMap.get(w._id.toString()) || {
      totalInsuranceAccrued: 0,
      completedJobs: 0,
    };

    return {
      workerId: w._id,
      user: w.userId,
      category: (w.category as any)?.name || "General Trades",
      policyNumber: WelfareService.generatePolicyNumber(w._id),
      coverageStatus: "ACTIVE_PROTECTED",
      experience: w.experience,
      rating: w.rating,
      completedJobs: stats.completedJobs,
      totalInsuranceContributed: stats.totalInsuranceAccrued,
    };
  });

  return ok(
    res,
    { workers: workerDirectory, total: workerDirectory.length },
    "Cooperative worker welfare directory retrieved successfully"
  );
}
