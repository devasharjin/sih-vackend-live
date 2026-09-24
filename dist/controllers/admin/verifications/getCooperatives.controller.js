"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminCooperatives = getAdminCooperatives;
const cooperative_model_1 = __importDefault(require("../../../models/auth/cooperative.model"));
const user_model_1 = __importDefault(require("../../../models/auth/user.model"));
const worker_model_1 = require("../../../models/auth/worker.model");
const envelope_1 = require("../../../shared/envelope");
/**
 * Get all cooperatives for admin verification with status filter, search & pagination
 */
async function getAdminCooperatives(req, res) {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    // Filter by verification status if specified and not 'All'
    if (status &&
        typeof status === "string" &&
        status !== "All" &&
        Object.values(worker_model_1.VerificationStatus).includes(status)) {
        query.verificationStatus = status;
    }
    // Search by cooperative name, email, phone, address, or applicant name
    if (search && typeof search === "string" && search.trim()) {
        const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchRegex = new RegExp(escaped, "i");
        // Match associated user names/emails
        const matchingUsers = await user_model_1.default.find({
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
    const [statusAggregation, cooperatives, searchFilteredCount] = await Promise.all([
        cooperative_model_1.default.aggregate([
            {
                $group: {
                    _id: "$verificationStatus",
                    count: { $sum: 1 },
                },
            },
        ]),
        cooperative_model_1.default.find(query)
            .populate("userId", "name email phone profilePicture accountStatus createdAt")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        search ? cooperative_model_1.default.countDocuments(query) : Promise.resolve(null),
    ]);
    let totalCount = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    for (const item of statusAggregation) {
        totalCount += item.count;
        if (item._id === worker_model_1.VerificationStatus.PENDING)
            pendingCount = item.count;
        else if (item._id === worker_model_1.VerificationStatus.APPROVED)
            approvedCount = item.count;
        else if (item._id === worker_model_1.VerificationStatus.REJECTED)
            rejectedCount = item.count;
    }
    let filteredTotal = totalCount;
    if (search) {
        filteredTotal = searchFilteredCount ?? 0;
    }
    else if (query.verificationStatus === worker_model_1.VerificationStatus.PENDING) {
        filteredTotal = pendingCount;
    }
    else if (query.verificationStatus === worker_model_1.VerificationStatus.APPROVED) {
        filteredTotal = approvedCount;
    }
    else if (query.verificationStatus === worker_model_1.VerificationStatus.REJECTED) {
        filteredTotal = rejectedCount;
    }
    const totalPages = Math.ceil(filteredTotal / limitNum) || 1;
    return (0, envelope_1.ok)(res, {
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
    }, "Cooperatives retrieved successfully");
}
//# sourceMappingURL=getCooperatives.controller.js.map