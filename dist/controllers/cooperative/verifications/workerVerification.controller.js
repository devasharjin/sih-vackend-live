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
exports.getCooperativeWorkers = getCooperativeWorkers;
exports.getCooperativeWorkerById = getCooperativeWorkerById;
exports.verifyWorker = verifyWorker;
const mongoose_1 = __importDefault(require("mongoose"));
const worker_model_1 = __importStar(require("../../../models/auth/worker.model"));
const cooperative_model_1 = __importDefault(require("../../../models/auth/cooperative.model"));
const user_model_1 = __importDefault(require("../../../models/auth/user.model"));
const envelope_1 = require("../../../shared/envelope");
/**
 * Get all workers registered under the authenticated cooperative
 */
async function getCooperativeWorkers(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user.id;
    // 1. Locate the cooperative belonging to this user
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found. Please register as a cooperative first.", null, 404);
    }
    const { status, search, page = 1, limit = 20 } = req.query;
    // 2. Build worker query
    const query = {
        cooperativeId: cooperative._id,
    };
    // Filter by verification status if specified
    if (status &&
        typeof status === "string" &&
        status !== "All" &&
        Object.values(worker_model_1.VerificationStatus).includes(status)) {
        query.verificationStatus = status;
    }
    // Search by worker name, email, or phone
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
    // 3. Count summary statistics for tabs
    const [totalCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
        worker_model_1.default.countDocuments({ cooperativeId: cooperative._id }),
        worker_model_1.default.countDocuments({
            cooperativeId: cooperative._id,
            verificationStatus: worker_model_1.VerificationStatus.PENDING,
        }),
        worker_model_1.default.countDocuments({
            cooperativeId: cooperative._id,
            verificationStatus: worker_model_1.VerificationStatus.APPROVED,
        }),
        worker_model_1.default.countDocuments({
            cooperativeId: cooperative._id,
            verificationStatus: worker_model_1.VerificationStatus.REJECTED,
        }),
    ]);
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;
    // 4. Fetch workers with populated references
    const workers = await worker_model_1.default.find(query)
        .populate("userId", "name email phone profilePicture accountStatus createdAt")
        .populate("category", "name icon slug description")
        .populate("categories", "name icon slug description")
        .populate("skills", "name description category priceType hourlyPrice metersPrice")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    const filteredTotal = await worker_model_1.default.countDocuments(query);
    const totalPages = Math.ceil(filteredTotal / limitNum);
    return (0, envelope_1.ok)(res, {
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
    }, "Cooperative workers retrieved successfully");
}
/**
 * Get details of a single worker registered under this cooperative
 */
async function getCooperativeWorkerById(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user.id;
    const id = String(req.params.id);
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid worker ID", null, 400);
    }
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    const worker = await worker_model_1.default.findOne({
        _id: id,
        cooperativeId: cooperative._id,
    })
        .populate("userId", "name email phone profilePicture accountStatus createdAt lastLoginAt")
        .populate("category", "name icon slug description")
        .populate("categories", "name icon slug description")
        .populate("skills", "name description category priceType hourlyPrice metersPrice");
    if (!worker) {
        return (0, envelope_1.fail)(res, "Worker profile not found or does not belong to your cooperative", null, 404);
    }
    return (0, envelope_1.ok)(res, worker, "Worker details retrieved successfully");
}
/**
 * Approve or reject a worker application for this cooperative
 */
async function verifyWorker(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user.id;
    const id = String(req.params.id);
    const { action, rejectionReason } = req.body;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid worker ID", null, 400);
    }
    if (action !== "APPROVE" && action !== "REJECT") {
        return (0, envelope_1.fail)(res, "Invalid action. Action must be either 'APPROVE' or 'REJECT'", null, 400);
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
        return (0, envelope_1.fail)(res, "Worker not found or does not belong to your cooperative", null, 404);
    }
    if (action === "APPROVE") {
        worker.verificationStatus = worker_model_1.VerificationStatus.APPROVED;
        if (worker.verificationDocuments) {
            if (worker.verificationDocuments.identity) {
                worker.verificationDocuments.identity.status = worker_model_1.VerificationStatus.APPROVED;
                worker.verificationDocuments.identity.rejectionReason = undefined;
            }
            if (worker.verificationDocuments.certificate) {
                worker.verificationDocuments.certificate.status = worker_model_1.VerificationStatus.APPROVED;
                worker.verificationDocuments.certificate.rejectionReason = undefined;
            }
        }
        await worker.save();
        const populatedWorker = await worker_model_1.default.findById(worker._id)
            .populate("userId", "name email phone profilePicture accountStatus")
            .populate("category", "name icon slug description")
            .populate("categories", "name icon slug description")
            .populate("skills", "name description category");
        return (0, envelope_1.ok)(res, populatedWorker, "Worker has been successfully approved and enrolled into your cooperative.");
    }
    else {
        // REJECT
        const reason = rejectionReason?.trim() ||
            "Verification documents or qualifications did not meet the cooperative standards.";
        worker.verificationStatus = worker_model_1.VerificationStatus.REJECTED;
        if (worker.verificationDocuments) {
            if (worker.verificationDocuments.identity) {
                worker.verificationDocuments.identity.status = worker_model_1.VerificationStatus.REJECTED;
                worker.verificationDocuments.identity.rejectionReason = reason;
            }
            if (worker.verificationDocuments.certificate) {
                worker.verificationDocuments.certificate.status = worker_model_1.VerificationStatus.REJECTED;
                worker.verificationDocuments.certificate.rejectionReason = reason;
            }
        }
        await worker.save();
        const populatedWorker = await worker_model_1.default.findById(worker._id)
            .populate("userId", "name email phone profilePicture accountStatus")
            .populate("category", "name icon slug description")
            .populate("categories", "name icon slug description")
            .populate("skills", "name description category");
        return (0, envelope_1.ok)(res, populatedWorker, "Worker registration has been rejected.");
    }
}
//# sourceMappingURL=workerVerification.controller.js.map