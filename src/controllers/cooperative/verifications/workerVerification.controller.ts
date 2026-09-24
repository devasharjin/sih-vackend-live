import { Request, Response } from "express";
import mongoose from "mongoose";
import Worker, { VerificationStatus } from "../../../models/auth/worker.model";
import Cooperative from "../../../models/auth/cooperative.model";
import User from "../../../models/auth/user.model";
import { fail, ok } from "../../../shared/envelope";

/**
 * Get all workers registered under the authenticated cooperative
 */
export async function getCooperativeWorkers(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any).id;

  // 1. Locate the cooperative belonging to this user
  const cooperative = await Cooperative.findOne({ userId });
  if (!cooperative) {
    return fail(
      res,
      "Cooperative profile not found. Please register as a cooperative first.",
      null,
      404
    );
  }

  const { status, search, page = 1, limit = 20 } = req.query;

  // 2. Build worker query
  const query: Record<string, any> = {
    cooperativeId: cooperative._id,
  };

  // Filter by verification status if specified
  if (
    status &&
    typeof status === "string" &&
    status !== "All" &&
    Object.values(VerificationStatus).includes(status as VerificationStatus)
  ) {
    query.verificationStatus = status;
  }

  // Search by worker name, email, or phone
  if (search && typeof search === "string" && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { phone: { $regex: searchRegex } },
      ],
    }).select("_id");

    const matchingUserIds = matchingUsers.map((u) => u._id);
    query.userId = { $in: matchingUserIds };
  }

  // 3. Count summary statistics for tabs
  const [totalCount, pendingCount, approvedCount, rejectedCount] =
    await Promise.all([
      Worker.countDocuments({ cooperativeId: cooperative._id }),
      Worker.countDocuments({
        cooperativeId: cooperative._id,
        verificationStatus: VerificationStatus.PENDING,
      }),
      Worker.countDocuments({
        cooperativeId: cooperative._id,
        verificationStatus: VerificationStatus.APPROVED,
      }),
      Worker.countDocuments({
        cooperativeId: cooperative._id,
        verificationStatus: VerificationStatus.REJECTED,
      }),
    ]);

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  // 4. Fetch workers with populated references
  const workers = await Worker.find(query)
    .populate(
      "userId",
      "name email phone profilePicture accountStatus createdAt"
    )
    .populate("category", "name icon slug description")
    .populate("categories", "name icon slug description")
    .populate(
      "skills",
      "name description category priceType hourlyPrice metersPrice"
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const filteredTotal = await Worker.countDocuments(query);
  const totalPages = Math.ceil(filteredTotal / limitNum);

  return ok(
    res,
    {
      cooperative: {
        _id: cooperative._id,
        cooperativeName: cooperative.cooperativeName,
      },
      workers,
      counts: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: filteredTotal,
        totalPages,
      },
    },
    "Cooperative workers retrieved successfully"
  );
}

/**
 * Get details of a single worker registered under this cooperative
 */
export async function getCooperativeWorkerById(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any).id;
  const id = String(req.params.id);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid worker ID", null, 400);
  }

  const cooperative = await Cooperative.findOne({ userId });
  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  const worker = await Worker.findOne({
    _id: id,
    cooperativeId: cooperative._id,
  })
    .populate(
      "userId",
      "name email phone profilePicture accountStatus createdAt lastLoginAt"
    )
    .populate("category", "name icon slug description")
    .populate("categories", "name icon slug description")
    .populate(
      "skills",
      "name description category priceType hourlyPrice metersPrice"
    );

  if (!worker) {
    return fail(
      res,
      "Worker profile not found or does not belong to your cooperative",
      null,
      404
    );
  }

  return ok(res, worker, "Worker details retrieved successfully");
}

/**
 * Approve or reject a worker application for this cooperative
 */
export async function verifyWorker(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any).id;
  const id = String(req.params.id);
  const { action, rejectionReason } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid worker ID", null, 400);
  }

  if (action !== "APPROVE" && action !== "REJECT") {
    return fail(
      res,
      "Invalid action. Action must be either 'APPROVE' or 'REJECT'",
      null,
      400
    );
  }

  const cooperative = await Cooperative.findOne({ userId });
  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  const worker = await Worker.findOne({
    _id: id,
    cooperativeId: cooperative._id,
  });

  if (!worker) {
    return fail(
      res,
      "Worker not found or does not belong to your cooperative",
      null,
      404
    );
  }

  if (action === "APPROVE") {
    worker.verificationStatus = VerificationStatus.APPROVED;
    if (worker.verificationDocuments) {
      if (worker.verificationDocuments.identity) {
        worker.verificationDocuments.identity.status = VerificationStatus.APPROVED;
        worker.verificationDocuments.identity.rejectionReason = undefined;
      }
      if (worker.verificationDocuments.certificate) {
        worker.verificationDocuments.certificate.status = VerificationStatus.APPROVED;
        worker.verificationDocuments.certificate.rejectionReason = undefined;
      }
    }

    await worker.save();

    const populatedWorker = await Worker.findById(worker._id)
      .populate("userId", "name email phone profilePicture accountStatus")
      .populate("category", "name icon slug description")
      .populate("categories", "name icon slug description")
      .populate("skills", "name description category");

    return ok(
      res,
      populatedWorker,
      "Worker has been successfully approved and enrolled into your cooperative."
    );
  } else {
    // REJECT
    const reason =
      rejectionReason?.trim() ||
      "Verification documents or qualifications did not meet the cooperative standards.";

    worker.verificationStatus = VerificationStatus.REJECTED;
    if (worker.verificationDocuments) {
      if (worker.verificationDocuments.identity) {
        worker.verificationDocuments.identity.status = VerificationStatus.REJECTED;
        worker.verificationDocuments.identity.rejectionReason = reason;
      }
      if (worker.verificationDocuments.certificate) {
        worker.verificationDocuments.certificate.status = VerificationStatus.REJECTED;
        worker.verificationDocuments.certificate.rejectionReason = reason;
      }
    }

    await worker.save();

    const populatedWorker = await Worker.findById(worker._id)
      .populate("userId", "name email phone profilePicture accountStatus")
      .populate("category", "name icon slug description")
      .populate("categories", "name icon slug description")
      .populate("skills", "name description category");

    return ok(
      res,
      populatedWorker,
      "Worker registration has been rejected."
    );
  }
}
