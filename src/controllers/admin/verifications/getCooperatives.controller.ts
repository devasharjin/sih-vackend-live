import { Request, Response } from "express";
import Cooperative from "../../../models/auth/cooperative.model";
import User from "../../../models/auth/user.model";
import { VerificationStatus } from "../../../models/auth/worker.model";
import { ok } from "../../../shared/envelope";

/**
 * Get all cooperatives for admin verification with status filter, search & pagination
 */
export async function getAdminCooperatives(req: Request, res: Response) {
  const { status, search, page = 1, limit = 20 } = req.query;

  const query: Record<string, any> = {};

  // Filter by verification status if specified and not 'All'
  if (
    status &&
    typeof status === "string" &&
    status !== "All" &&
    Object.values(VerificationStatus).includes(status as VerificationStatus)
  ) {
    query.verificationStatus = status;
  }

  // Search by cooperative name, email, phone, address, or applicant name
  if (search && typeof search === "string" && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escaped, "i");

    // Match associated user names/emails
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { phone: { $regex: searchRegex } },
      ],
    })
      .select("_id")
      .lean();

    const matchingUserIds = matchingUsers.map((u) => u._id);

    query.$or = [
      { cooperativeName: { $regex: searchRegex } },
      { cooperativeEmail: { $regex: searchRegex } },
      { cooperativePhone: { $regex: searchRegex } },
      { cooperativeAddress: { $regex: searchRegex } },
      { userId: { $in: matchingUserIds } },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Run status count aggregation and query fetch in parallel (1 batch to Atlas instead of 6 sequential queries)
  const [statusAggregation, cooperatives, searchFilteredCount] =
    await Promise.all([
      Cooperative.aggregate([
        {
          $group: {
            _id: "$verificationStatus",
            count: { $sum: 1 },
          },
        },
      ]),
      Cooperative.find(query)
        .populate(
          "userId",
          "name email phone profilePicture accountStatus createdAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      search ? Cooperative.countDocuments(query) : Promise.resolve(null),
    ]);

  let totalCount = 0;
  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  for (const item of statusAggregation) {
    totalCount += item.count;
    if (item._id === VerificationStatus.PENDING) pendingCount = item.count;
    else if (item._id === VerificationStatus.APPROVED) approvedCount = item.count;
    else if (item._id === VerificationStatus.REJECTED) rejectedCount = item.count;
  }

  let filteredTotal = totalCount;
  if (search) {
    filteredTotal = searchFilteredCount ?? 0;
  } else if (query.verificationStatus === VerificationStatus.PENDING) {
    filteredTotal = pendingCount;
  } else if (query.verificationStatus === VerificationStatus.APPROVED) {
    filteredTotal = approvedCount;
  } else if (query.verificationStatus === VerificationStatus.REJECTED) {
    filteredTotal = rejectedCount;
  }

  const totalPages = Math.ceil(filteredTotal / limitNum) || 1;

  return ok(
    res,
    {
      cooperatives,
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
    "Cooperatives retrieved successfully"
  );
}
