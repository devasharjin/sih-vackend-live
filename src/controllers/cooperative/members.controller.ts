import { Request, Response } from "express";
import mongoose from "mongoose";
import Worker, {
  AvailabilityStatus,
  VerificationStatus,
} from "../../models/auth/worker.model";
import Cooperative from "../../models/auth/cooperative.model";
import User from "../../models/auth/user.model";
import Booking, { BookingStatus } from "../../models/booking.model";
import WelfareClaim from "../../models/welfareClaim.model";
import { fail, ok } from "../../shared/envelope";

/**
 * List all member workers with search, filters, pagination, and KPI counts
 */
export async function getCooperativeMembers(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const cooperative = await Cooperative.findOne({ userId });
  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  const coopId = cooperative._id as mongoose.Types.ObjectId;

  const {
    search,
    status,
    availability,
    skill,
    category,
    page = "1",
    limit = "20",
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Base query: worker must belong to this cooperative
  const query: Record<string, any> = {
    cooperativeId: coopId,
  };

  // Status Filter
  if (status && status !== "ALL") {
    if (status === "ACTIVE") {
      query.isActive = true;
      query.verificationStatus = VerificationStatus.APPROVED;
    } else if (status === "INACTIVE") {
      query.isActive = false;
    } else if (Object.values(VerificationStatus).includes(status as VerificationStatus)) {
      query.verificationStatus = status;
    }
  }

  // Availability Filter
  if (
    availability &&
    availability !== "ALL" &&
    Object.values(AvailabilityStatus).includes(availability as AvailabilityStatus)
  ) {
    query.availability = availability;
  }

  // Skill Filter
  if (skill && skill !== "ALL") {
    if (mongoose.Types.ObjectId.isValid(skill as string)) {
      query.skills = skill;
    }
  }

  // Category Filter
  if (category && category !== "ALL") {
    if (mongoose.Types.ObjectId.isValid(category as string)) {
      const catObjId = new mongoose.Types.ObjectId(category as string);
      query.$or = [{ category: catObjId }, { categories: catObjId }];
    }
  }

  // Search Filter (Worker name, email, phone)
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

  // Aggregate KPI summary for society roster
  const [
    totalMembers,
    activeOnDuty,
    inactiveCount,
    fullTimeCount,
    partTimeCount,
    pendingVerificationCount,
    ratingAgg,
  ] = await Promise.all([
    Worker.countDocuments({ cooperativeId: coopId }),
    Worker.countDocuments({
      cooperativeId: coopId,
      isActive: true,
      verificationStatus: VerificationStatus.APPROVED,
    }),
    Worker.countDocuments({ cooperativeId: coopId, isActive: false }),
    Worker.countDocuments({
      cooperativeId: coopId,
      availability: AvailabilityStatus.FULL_TIME,
    }),
    Worker.countDocuments({
      cooperativeId: coopId,
      availability: AvailabilityStatus.PART_TIME,
    }),
    Worker.countDocuments({
      cooperativeId: coopId,
      verificationStatus: VerificationStatus.PENDING,
    }),
    Worker.aggregate([
      { $match: { cooperativeId: coopId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalJobs: { $sum: "$totalJobsCompleted" },
        },
      },
    ]),
  ]);

  const [workers, totalFiltered] = await Promise.all([
    Worker.find(query)
      .populate("userId", "name email phone profilePicture accountStatus createdAt")
      .populate("category", "name icon slug description")
      .populate("categories", "name icon slug description")
      .populate("skills", "name description category priceType hourlyPrice metersPrice")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Worker.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalFiltered / limitNum);

  return ok(
    res,
    {
      members: workers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalFiltered,
        totalPages,
      },
      stats: {
        totalMembers,
        activeOnDuty,
        inactiveCount,
        fullTimeCount,
        partTimeCount,
        pendingVerificationCount,
        averageRating: Number((ratingAgg[0]?.avgRating || 0).toFixed(1)),
        totalJobsCompleted: ratingAgg[0]?.totalJobs || 0,
      },
    },
    "Cooperative member directory retrieved successfully"
  );
}

/**
 * Toggle active status or availability of a member worker
 */
export async function toggleMemberStatus(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const id = String(req.params.id);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid worker member ID", null, 400);
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
    return fail(res, "Member worker not found in your cooperative roster", null, 404);
  }

  const { isActive, availability } = req.body;

  if (typeof isActive === "boolean") {
    worker.isActive = isActive;
  }

  if (
    availability &&
    Object.values(AvailabilityStatus).includes(availability as AvailabilityStatus)
  ) {
    worker.availability = availability;
  }

  await worker.save();

  const updatedWorker = await Worker.findById(worker._id)
    .populate("userId", "name email phone profilePicture accountStatus")
    .populate("category", "name icon slug description")
    .populate("categories", "name icon slug description")
    .populate("skills", "name description category priceType hourlyPrice metersPrice");

  return ok(
    res,
    updatedWorker,
    `Member worker ${worker.isActive ? "activated for dispatch" : "marked inactive"}`
  );
}

/**
 * Get single member dossier with historical jobs, claims, and verification documents
 */
export async function getMemberDetails(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const id = String(req.params.id);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid member worker ID", null, 400);
  }

  const cooperative = await Cooperative.findOne({ userId });
  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  const worker = await Worker.findOne({
    _id: id,
    cooperativeId: cooperative._id,
  })
    .populate("userId", "name email phone profilePicture accountStatus createdAt")
    .populate("category", "name icon slug description")
    .populate("categories", "name icon slug description")
    .populate("skills", "name description category priceType hourlyPrice metersPrice")
    .lean();

  if (!worker) {
    return fail(res, "Member worker not found in your cooperative roster", null, 404);
  }

  // Get recent 10 bookings handled by this worker
  const recentGigs = await Booking.find({ worker: worker._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("customer", "name phone")
    .populate("service", "name")
    .lean();

  // Get welfare claims & grants for this worker
  const welfareClaims = await WelfareClaim.find({ worker: worker._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return ok(
    res,
    {
      member: worker,
      recentGigs,
      welfareClaims,
    },
    "Member dossier retrieved successfully"
  );
}
