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
exports.getCooperativeMembers = getCooperativeMembers;
exports.toggleMemberStatus = toggleMemberStatus;
exports.getMemberDetails = getMemberDetails;
const mongoose_1 = __importDefault(require("mongoose"));
const worker_model_1 = __importStar(require("../../models/auth/worker.model"));
const cooperative_model_1 = __importDefault(require("../../models/auth/cooperative.model"));
const user_model_1 = __importDefault(require("../../models/auth/user.model"));
const booking_model_1 = __importDefault(require("../../models/booking.model"));
const welfareClaim_model_1 = __importDefault(require("../../models/welfareClaim.model"));
const envelope_1 = require("../../shared/envelope");
/**
 * List all member workers with search, filters, pagination, and KPI counts
 */
async function getCooperativeMembers(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    const coopId = cooperative._id;
    const { search, status, availability, skill, category, page = "1", limit = "20", } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    // Base query: worker must belong to this cooperative
    const query = {
        cooperativeId: coopId,
    };
    // Status Filter
    if (status && status !== "ALL") {
        if (status === "ACTIVE") {
            query.isActive = true;
            query.verificationStatus = worker_model_1.VerificationStatus.APPROVED;
        }
        else if (status === "INACTIVE") {
            query.isActive = false;
        }
        else if (Object.values(worker_model_1.VerificationStatus).includes(status)) {
            query.verificationStatus = status;
        }
    }
    // Availability Filter
    if (availability &&
        availability !== "ALL" &&
        Object.values(worker_model_1.AvailabilityStatus).includes(availability)) {
        query.availability = availability;
    }
    // Skill Filter
    if (skill && skill !== "ALL") {
        if (mongoose_1.default.Types.ObjectId.isValid(skill)) {
            query.skills = skill;
        }
    }
    // Category Filter
    if (category && category !== "ALL") {
        if (mongoose_1.default.Types.ObjectId.isValid(category)) {
            const catObjId = new mongoose_1.default.Types.ObjectId(category);
            query.$or = [{ category: catObjId }, { categories: catObjId }];
        }
    }
    // Search Filter (Worker name, email, phone)
    if (search && typeof search === "string" && search.trim()) {
        const searchRegex = new RegExp(search.trim(), "i");
        const matchingUsers = await user_model_1.default.find({
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
    const [totalMembers, activeOnDuty, inactiveCount, fullTimeCount, partTimeCount, pendingVerificationCount, ratingAgg,] = await Promise.all([
        worker_model_1.default.countDocuments({ cooperativeId: coopId }),
        worker_model_1.default.countDocuments({
            cooperativeId: coopId,
            isActive: true,
            verificationStatus: worker_model_1.VerificationStatus.APPROVED,
        }),
        worker_model_1.default.countDocuments({ cooperativeId: coopId, isActive: false }),
        worker_model_1.default.countDocuments({
            cooperativeId: coopId,
            availability: worker_model_1.AvailabilityStatus.FULL_TIME,
        }),
        worker_model_1.default.countDocuments({
            cooperativeId: coopId,
            availability: worker_model_1.AvailabilityStatus.PART_TIME,
        }),
        worker_model_1.default.countDocuments({
            cooperativeId: coopId,
            verificationStatus: worker_model_1.VerificationStatus.PENDING,
        }),
        worker_model_1.default.aggregate([
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
        worker_model_1.default.find(query)
            .populate("userId", "name email phone profilePicture accountStatus createdAt")
            .populate("category", "name icon slug description")
            .populate("categories", "name icon slug description")
            .populate("skills", "name description category priceType hourlyPrice metersPrice")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        worker_model_1.default.countDocuments(query),
    ]);
    const totalPages = Math.ceil(totalFiltered / limitNum);
    return (0, envelope_1.ok)(res, {
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
    }, "Cooperative member directory retrieved successfully");
}
/**
 * Toggle active status or availability of a member worker
 */
async function toggleMemberStatus(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const id = String(req.params.id);
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid worker member ID", null, 400);
    }
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    const worker = await worker_model_1.default.findOne({
        _id: id,
        cooperativeId: cooperative._id,
    });
    if (!worker) {
        return (0, envelope_1.fail)(res, "Member worker not found in your cooperative roster", null, 404);
    }
    const { isActive, availability } = req.body;
    if (typeof isActive === "boolean") {
        worker.isActive = isActive;
    }
    if (availability &&
        Object.values(worker_model_1.AvailabilityStatus).includes(availability)) {
        worker.availability = availability;
    }
    await worker.save();
    const updatedWorker = await worker_model_1.default.findById(worker._id)
        .populate("userId", "name email phone profilePicture accountStatus")
        .populate("category", "name icon slug description")
        .populate("categories", "name icon slug description")
        .populate("skills", "name description category priceType hourlyPrice metersPrice");
    return (0, envelope_1.ok)(res, updatedWorker, `Member worker ${worker.isActive ? "activated for dispatch" : "marked inactive"}`);
}
/**
 * Get single member dossier with historical jobs, claims, and verification documents
 */
async function getMemberDetails(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const id = String(req.params.id);
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid member worker ID", null, 400);
    }
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    const worker = await worker_model_1.default.findOne({
        _id: id,
        cooperativeId: cooperative._id,
    })
        .populate("userId", "name email phone profilePicture accountStatus createdAt")
        .populate("category", "name icon slug description")
        .populate("categories", "name icon slug description")
        .populate("skills", "name description category priceType hourlyPrice metersPrice")
        .lean();
    if (!worker) {
        return (0, envelope_1.fail)(res, "Member worker not found in your cooperative roster", null, 404);
    }
    // Get recent 10 bookings handled by this worker
    const recentGigs = await booking_model_1.default.find({ worker: worker._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("customer", "name phone")
        .populate("service", "name")
        .lean();
    // Get welfare claims & grants for this worker
    const welfareClaims = await welfareClaim_model_1.default.find({ worker: worker._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    return (0, envelope_1.ok)(res, {
        member: worker,
        recentGigs,
        welfareClaims,
    }, "Member dossier retrieved successfully");
}
//# sourceMappingURL=members.controller.js.map