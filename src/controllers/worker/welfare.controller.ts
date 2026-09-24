import { Request, Response } from "express";
import mongoose from "mongoose";
import Worker from "../../models/auth/worker.model";
import User from "../../models/auth/user.model";
import WelfareClaim, {
  WelfareClaimStatus,
  WelfareClaimType,
  WelfareUrgency,
} from "../../models/welfareClaim.model";
import { WelfareService, PLATFORM_WELFARE_POLICY } from "../../services/welfare.service";
import { fail, ok } from "../../shared/envelope";

/**
 * Get worker's insurance policy overview, contribution stats, and claim summary
 */
export async function getWorkerWelfareOverview(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const worker = await Worker.findOne({ userId });

  if (!worker) {
    return fail(res, "Worker profile not found", null, 404);
  }

  const summary = await WelfareService.getWorkerWelfareSummary(worker._id as mongoose.Types.ObjectId);

  return ok(res, summary, "Worker welfare overview retrieved successfully");
}

/**
 * Get all claims submitted by the logged-in worker
 */
export async function getWorkerClaims(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const worker = await Worker.findOne({ userId });

  if (!worker) {
    return fail(res, "Worker profile not found", null, 404);
  }

  const { status, page = "1", limit = "20" } = req.query;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(50, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const query: Record<string, any> = { worker: worker._id };

  if (status && status !== "ALL" && Object.values(WelfareClaimStatus).includes(status as WelfareClaimStatus)) {
    query.status = status;
  }

  const [claims, total] = await Promise.all([
    WelfareClaim.find(query)
      .populate("cooperative", "cooperativeName cooperativePhone cooperativeEmail")
      .populate("booking", "bookingNumber totalAmount scheduledDate")
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
    "Worker claims retrieved successfully"
  );
}

/**
 * Submit a new welfare or insurance claim
 */
export async function fileWorkerClaim(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const worker = await Worker.findOne({ userId });

  if (!worker) {
    return fail(res, "Worker profile not found", null, 404);
  }

  const {
    claimType,
    title,
    description,
    amountRequested,
    urgency = WelfareUrgency.STANDARD,
    incidentDate,
    bookingId,
    documents = [],
  } = req.body;

  // 1. Validation
  if (!claimType || !Object.values(WelfareClaimType).includes(claimType)) {
    return fail(res, "Valid claim type is required", null, 400);
  }

  if (!title || typeof title !== "string" || !title.trim()) {
    return fail(res, "Claim title is required", null, 400);
  }

  if (!description || typeof description !== "string" || !description.trim()) {
    return fail(res, "Detailed incident description is required", null, 400);
  }

  const amount = Number(amountRequested);
  if (isNaN(amount) || amount < 100) {
    return fail(res, "Amount requested must be at least ₹100", null, 400);
  }

  // Check category coverage limit
  const coverageLimits = PLATFORM_WELFARE_POLICY.coverage;
  let maxAllowed = coverageLimits.accidentalInjuryMax;

  if (claimType === WelfareClaimType.MEDICAL_HOSPITALIZATION) {
    maxAllowed = coverageLimits.hospitalizationMax;
  } else if (claimType === WelfareClaimType.EMERGENCY_HARDSHIP) {
    maxAllowed = coverageLimits.emergencyHardshipMax;
  } else if (claimType === WelfareClaimType.TOOL_EQUIPMENT_LOSS) {
    maxAllowed = coverageLimits.toolEquipmentLossMax;
  } else if (claimType === WelfareClaimType.HEALTH_CHECKUP) {
    maxAllowed = coverageLimits.healthCheckupAnnualMax;
  }

  if (amount > maxAllowed) {
    return fail(
      res,
      `Requested amount (₹${amount}) exceeds the maximum policy limit of ₹${maxAllowed.toLocaleString("en-IN")} for ${claimType}`,
      null,
      400
    );
  }

  const user = await User.findById(userId).select("name");

  // 2. Create the claim
  const claim = await WelfareClaim.create({
    worker: worker._id,
    workerUser: userId,
    cooperative: worker.cooperativeId,
    booking: bookingId && mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : undefined,
    claimType,
    urgency,
    title: title.trim(),
    description: description.trim(),
    incidentDate: incidentDate ? new Date(incidentDate) : new Date(),
    amountRequested: amount,
    status: WelfareClaimStatus.SUBMITTED,
    documents: Array.isArray(documents) ? documents : [],
    auditLog: [
      {
        action: "CLAIM_SUBMITTED",
        performedBy: userId,
        performedByName: user?.name || "Worker",
        performedByRole: "WORKER",
        timestamp: new Date(),
        notes: `Claim for ₹${amount} submitted under ${claimType}`,
      },
    ],
  });

  return ok(res, claim, "Welfare claim submitted successfully for cooperative review");
}

/**
 * Get single claim details
 */
export async function getWorkerClaimById(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const worker = await Worker.findOne({ userId });

  if (!worker) {
    return fail(res, "Worker profile not found", null, 404);
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid claim ID", null, 400);
  }

  const claim = await WelfareClaim.findOne({ _id: id, worker: worker._id })
    .populate("cooperative", "cooperativeName cooperativeEmail cooperativePhone")
    .populate("booking", "bookingNumber scheduledDate totalAmount")
    .populate("auditLog.performedBy", "name email")
    .lean();

  if (!claim) {
    return fail(res, "Claim not found", null, 404);
  }

  return ok(res, claim, "Claim details retrieved successfully");
}
