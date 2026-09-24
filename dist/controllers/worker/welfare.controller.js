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
exports.getWorkerWelfareOverview = getWorkerWelfareOverview;
exports.getWorkerClaims = getWorkerClaims;
exports.fileWorkerClaim = fileWorkerClaim;
exports.getWorkerClaimById = getWorkerClaimById;
const mongoose_1 = __importDefault(require("mongoose"));
const worker_model_1 = __importDefault(require("../../models/auth/worker.model"));
const user_model_1 = __importDefault(require("../../models/auth/user.model"));
const welfareClaim_model_1 = __importStar(require("../../models/welfareClaim.model"));
const welfare_service_1 = require("../../services/welfare.service");
const envelope_1 = require("../../shared/envelope");
/**
 * Get worker's insurance policy overview, contribution stats, and claim summary
 */
async function getWorkerWelfareOverview(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const worker = await worker_model_1.default.findOne({ userId });
    if (!worker) {
        return (0, envelope_1.fail)(res, "Worker profile not found", null, 404);
    }
    const summary = await welfare_service_1.WelfareService.getWorkerWelfareSummary(worker._id);
    return (0, envelope_1.ok)(res, summary, "Worker welfare overview retrieved successfully");
}
/**
 * Get all claims submitted by the logged-in worker
 */
async function getWorkerClaims(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const worker = await worker_model_1.default.findOne({ userId });
    if (!worker) {
        return (0, envelope_1.fail)(res, "Worker profile not found", null, 404);
    }
    const { status, page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const query = { worker: worker._id };
    if (status && status !== "ALL" && Object.values(welfareClaim_model_1.WelfareClaimStatus).includes(status)) {
        query.status = status;
    }
    const [claims, total] = await Promise.all([
        welfareClaim_model_1.default.find(query)
            .populate("cooperative", "cooperativeName cooperativePhone cooperativeEmail")
            .populate("booking", "bookingNumber totalAmount scheduledDate")
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
    }, "Worker claims retrieved successfully");
}
/**
 * Submit a new welfare or insurance claim
 */
async function fileWorkerClaim(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const worker = await worker_model_1.default.findOne({ userId });
    if (!worker) {
        return (0, envelope_1.fail)(res, "Worker profile not found", null, 404);
    }
    const { claimType, title, description, amountRequested, urgency = welfareClaim_model_1.WelfareUrgency.STANDARD, incidentDate, bookingId, documents = [], } = req.body;
    // 1. Validation
    if (!claimType || !Object.values(welfareClaim_model_1.WelfareClaimType).includes(claimType)) {
        return (0, envelope_1.fail)(res, "Valid claim type is required", null, 400);
    }
    if (!title || typeof title !== "string" || !title.trim()) {
        return (0, envelope_1.fail)(res, "Claim title is required", null, 400);
    }
    if (!description || typeof description !== "string" || !description.trim()) {
        return (0, envelope_1.fail)(res, "Detailed incident description is required", null, 400);
    }
    const amount = Number(amountRequested);
    if (isNaN(amount) || amount < 100) {
        return (0, envelope_1.fail)(res, "Amount requested must be at least ₹100", null, 400);
    }
    // Check category coverage limit
    const coverageLimits = welfare_service_1.PLATFORM_WELFARE_POLICY.coverage;
    let maxAllowed = coverageLimits.accidentalInjuryMax;
    if (claimType === welfareClaim_model_1.WelfareClaimType.MEDICAL_HOSPITALIZATION) {
        maxAllowed = coverageLimits.hospitalizationMax;
    }
    else if (claimType === welfareClaim_model_1.WelfareClaimType.EMERGENCY_HARDSHIP) {
        maxAllowed = coverageLimits.emergencyHardshipMax;
    }
    else if (claimType === welfareClaim_model_1.WelfareClaimType.TOOL_EQUIPMENT_LOSS) {
        maxAllowed = coverageLimits.toolEquipmentLossMax;
    }
    else if (claimType === welfareClaim_model_1.WelfareClaimType.HEALTH_CHECKUP) {
        maxAllowed = coverageLimits.healthCheckupAnnualMax;
    }
    if (amount > maxAllowed) {
        return (0, envelope_1.fail)(res, `Requested amount (₹${amount}) exceeds the maximum policy limit of ₹${maxAllowed.toLocaleString("en-IN")} for ${claimType}`, null, 400);
    }
    const user = await user_model_1.default.findById(userId).select("name");
    // 2. Create the claim
    const claim = await welfareClaim_model_1.default.create({
        worker: worker._id,
        workerUser: userId,
        cooperative: worker.cooperativeId,
        booking: bookingId && mongoose_1.default.Types.ObjectId.isValid(bookingId) ? bookingId : undefined,
        claimType,
        urgency,
        title: title.trim(),
        description: description.trim(),
        incidentDate: incidentDate ? new Date(incidentDate) : new Date(),
        amountRequested: amount,
        status: welfareClaim_model_1.WelfareClaimStatus.SUBMITTED,
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
    return (0, envelope_1.ok)(res, claim, "Welfare claim submitted successfully for cooperative review");
}
/**
 * Get single claim details
 */
async function getWorkerClaimById(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const worker = await worker_model_1.default.findOne({ userId });
    if (!worker) {
        return (0, envelope_1.fail)(res, "Worker profile not found", null, 404);
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid claim ID", null, 400);
    }
    const claim = await welfareClaim_model_1.default.findOne({ _id: id, worker: worker._id })
        .populate("cooperative", "cooperativeName cooperativeEmail cooperativePhone")
        .populate("booking", "bookingNumber scheduledDate totalAmount")
        .populate("auditLog.performedBy", "name email")
        .lean();
    if (!claim) {
        return (0, envelope_1.fail)(res, "Claim not found", null, 404);
    }
    return (0, envelope_1.ok)(res, claim, "Claim details retrieved successfully");
}
//# sourceMappingURL=welfare.controller.js.map