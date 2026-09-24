"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCooperativeWelfareStats = getCooperativeWelfareStats;
exports.getCooperativeClaims = getCooperativeClaims;
exports.updateCooperativeClaimStatus = updateCooperativeClaimStatus;
exports.issueEmergencyGrant = issueEmergencyGrant;
exports.getCooperativeWorkerWelfareList = getCooperativeWorkerWelfareList;
const mongoose_1 = __importDefault(require("mongoose"));
const cooperative_model_1 = __importDefault(require("../../models/auth/cooperative.model"));
const worker_model_1 = __importDefault(require("../../models/auth/worker.model"));
const user_model_1 = __importDefault(require("../../models/auth/user.model"));
const booking_model_1 = __importStar(require("../../models/booking.model"));
const welfareClaim_model_1 = __importStar(require("../../models/welfareClaim.model"));
const welfare_service_1 = require("../../services/welfare.service");
const envelope_1 = require("../../shared/envelope");
/**
 * Get cooperative welfare fund statistics and reserve health
 */
async function getCooperativeWelfareStats(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    const stats = await welfare_service_1.WelfareService.getCooperativeWelfareMetrics(cooperative._id);
    return (0, envelope_1.ok)(res, {
        ...stats,
        cooperative: {
            id: cooperative._id,
            name: cooperative.cooperativeName,
        },
    }, "Cooperative welfare statistics retrieved successfully");
}
/**
 * Get all claims submitted by workers of this cooperative
 */
async function getCooperativeClaims(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    const { status, claimType, urgency, search, page = "1", limit = "20", } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const query = { cooperative: cooperative._id };
    if (status && status !== "ALL" && Object.values(welfareClaim_model_1.WelfareClaimStatus).includes(status)) {
        query.status = status;
    }
    if (claimType && claimType !== "ALL" && Object.values(welfareClaim_model_1.WelfareClaimType).includes(claimType)) {
        query.claimType = claimType;
    }
    if (urgency && urgency !== "ALL" && Object.values(welfareClaim_model_1.WelfareUrgency).includes(urgency)) {
        query.urgency = urgency;
    }
    if (search && typeof search === "string" && search.trim()) {
        const s = search.trim();
        const regex = new RegExp(s, "i");
        const matchingUsers = await user_model_1.default.find({ name: regex }).select("_id").lean();
        const matchingUserIds = matchingUsers.map((u) => u._id);
        query.$or = [
            { claimNumber: regex },
            { title: regex },
            ...(matchingUserIds.length > 0 ? [{ workerUser: { $in: matchingUserIds } }] : []),
        ];
    }
    const [claims, total] = await Promise.all([
        welfareClaim_model_1.default.find(query)
            .populate("workerUser", "name phone email profilePicture")
            .populate("booking", "bookingNumber scheduledDate totalAmount")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        welfareClaim_model_1.default.countDocuments(query),
    ]);
    return (0, envelope_1.ok)(res, {
        claims,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
    }, "Cooperative claims retrieved successfully");
}
/**
 * Update welfare claim status (UNDER_REVIEW, APPROVED, REJECTED, DISBURSED)
 */
async function updateCooperativeClaimStatus(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid claim ID", null, 400);
    }
    const claim = await welfareClaim_model_1.default.findOne({ _id: id, cooperative: cooperative._id });
    if (!claim) {
        return (0, envelope_1.fail)(res, "Claim not found in this cooperative", null, 404);
    }
    const { status, amountApproved, reviewNotes, rejectionReason, disbursementTxnId } = req.body;
    if (!status || !Object.values(welfareClaim_model_1.WelfareClaimStatus).includes(status)) {
        return (0, envelope_1.fail)(res, "Valid claim status is required", null, 400);
    }
    const reviewerUser = await user_model_1.default.findById(userId).select("name");
    const reviewerName = reviewerUser?.name || "Cooperative Officer";
    // Validate state-specific transitions
    if (status === welfareClaim_model_1.WelfareClaimStatus.APPROVED) {
        const approved = Number(amountApproved);
        if (isNaN(approved) || approved <= 0) {
            return (0, envelope_1.fail)(res, "Approved amount is required and must be greater than zero", null, 400);
        }
        claim.amountApproved = approved;
        claim.reviewNotes = reviewNotes || claim.reviewNotes;
    }
    else if (status === welfareClaim_model_1.WelfareClaimStatus.REJECTED) {
        if (!rejectionReason || !rejectionReason.trim()) {
            return (0, envelope_1.fail)(res, "Reason for rejection is required", null, 400);
        }
        claim.rejectionReason = rejectionReason.trim();
        claim.reviewNotes = reviewNotes || claim.reviewNotes;
    }
    else if (status === welfareClaim_model_1.WelfareClaimStatus.DISBURSED) {
        if (claim.status !== welfareClaim_model_1.WelfareClaimStatus.APPROVED) {
            return (0, envelope_1.fail)(res, "Only approved claims can be marked as disbursed", null, 400);
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
    return (0, envelope_1.ok)(res, claim, `Claim status successfully updated to ${status}`);
}
/**
 * Direct emergency relief grant issued by cooperative to a worker
 */
async function issueEmergencyGrant(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    const { workerId, amount, reason, disbursementTxnId } = req.body;
    if (!workerId || !mongoose_1.default.Types.ObjectId.isValid(workerId)) {
        return (0, envelope_1.fail)(res, "Valid worker ID is required", null, 400);
    }
    const worker = await worker_model_1.default.findOne({ _id: workerId, cooperativeId: cooperative._id });
    if (!worker) {
        return (0, envelope_1.fail)(res, "Worker not found in this cooperative", null, 404);
    }
    const grantAmount = Number(amount);
    const maxEmergencyLimit = welfare_service_1.PLATFORM_WELFARE_POLICY.coverage.emergencyHardshipMax;
    if (isNaN(grantAmount) || grantAmount < 100 || grantAmount > maxEmergencyLimit) {
        return (0, envelope_1.fail)(res, `Emergency grant amount must be between ₹100 and ₹${maxEmergencyLimit.toLocaleString("en-IN")}`, null, 400);
    }
    if (!reason || !reason.trim()) {
        return (0, envelope_1.fail)(res, "Emergency justification reason is required", null, 400);
    }
    const adminUser = await user_model_1.default.findById(userId).select("name");
    // Create auto-approved and disbursed emergency claim
    const claim = await welfareClaim_model_1.default.create({
        worker: worker._id,
        workerUser: worker.userId,
        cooperative: cooperative._id,
        claimType: welfareClaim_model_1.WelfareClaimType.EMERGENCY_HARDSHIP,
        urgency: welfareClaim_model_1.WelfareUrgency.CRITICAL,
        title: `Cooperative Emergency Grant: ${reason.trim().slice(0, 60)}`,
        description: reason.trim(),
        amountRequested: grantAmount,
        amountApproved: grantAmount,
        amountDisbursed: grantAmount,
        status: welfareClaim_model_1.WelfareClaimStatus.DISBURSED,
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
    return (0, envelope_1.ok)(res, claim, "Emergency relief grant successfully issued and disbursed");
}
/**
 * Directory of cooperative workers with their insurance coverage details
 */
async function getCooperativeWorkerWelfareList(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    const workers = await worker_model_1.default.find({ cooperativeId: cooperative._id })
        .populate("userId", "name phone email profilePicture")
        .populate("category", "name icon slug")
        .lean();
    const workerIds = workers.map((w) => w._id);
    // Aggregate contributions per worker
    const bookingAggs = await booking_model_1.default.aggregate([
        {
            $match: {
                worker: { $in: workerIds },
                status: booking_model_1.BookingStatus.COMPLETED,
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
            category: w.category?.name || "General Trades",
            policyNumber: welfare_service_1.WelfareService.generatePolicyNumber(w._id),
            coverageStatus: "ACTIVE_PROTECTED",
            experience: w.experience,
            rating: w.rating,
            completedJobs: stats.completedJobs,
            totalInsuranceContributed: stats.totalInsuranceAccrued,
        };
    });
    return (0, envelope_1.ok)(res, { workers: workerDirectory, total: workerDirectory.length }, "Cooperative worker welfare directory retrieved successfully");
}
//# sourceMappingURL=welfare.controller.js.map