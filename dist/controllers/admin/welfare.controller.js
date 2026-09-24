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
exports.getPlatformWelfareStats = getPlatformWelfareStats;
exports.getAdminClaims = getAdminClaims;
exports.auditAdminClaim = auditAdminClaim;
exports.getPlatformWelfarePolicyConfig = getPlatformWelfarePolicyConfig;
const mongoose_1 = __importDefault(require("mongoose"));
const welfareClaim_model_1 = __importStar(require("../../models/welfareClaim.model"));
const user_model_1 = __importDefault(require("../../models/auth/user.model"));
const cooperative_model_1 = __importDefault(require("../../models/auth/cooperative.model"));
const welfare_service_1 = require("../../services/welfare.service");
const envelope_1 = require("../../shared/envelope");
/**
 * Get platform-wide insurance fund reserve health and claims metrics
 */
async function getPlatformWelfareStats(_req, res) {
    const stats = await welfare_service_1.WelfareService.getPlatformWelfareMetrics();
    return (0, envelope_1.ok)(res, stats, "Platform welfare & insurance statistics retrieved successfully");
}
/**
 * Get all claims across the platform with filtering, search, and pagination
 */
async function getAdminClaims(req, res) {
    const { status, claimType, cooperativeId, search, page = "1", limit = "20", } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const query = {};
    if (status && status !== "ALL" && Object.values(welfareClaim_model_1.WelfareClaimStatus).includes(status)) {
        query.status = status;
    }
    if (claimType && claimType !== "ALL" && Object.values(welfareClaim_model_1.WelfareClaimType).includes(claimType)) {
        query.claimType = claimType;
    }
    if (cooperativeId && mongoose_1.default.Types.ObjectId.isValid(cooperativeId)) {
        query.cooperative = new mongoose_1.default.Types.ObjectId(cooperativeId);
    }
    if (search && typeof search === "string" && search.trim()) {
        const s = search.trim();
        const regex = new RegExp(s, "i");
        const [matchingUsers, matchingCoops] = await Promise.all([
            user_model_1.default.find({ name: regex }).select("_id").lean(),
            cooperative_model_1.default.find({ cooperativeName: regex }).select("_id").lean(),
        ]);
        const matchingUserIds = matchingUsers.map((u) => u._id);
        const matchingCoopIds = matchingCoops.map((c) => c._id);
        query.$or = [
            { claimNumber: regex },
            { title: regex },
            ...(matchingUserIds.length > 0 ? [{ workerUser: { $in: matchingUserIds } }] : []),
            ...(matchingCoopIds.length > 0 ? [{ cooperative: { $in: matchingCoopIds } }] : []),
        ];
    }
    const [claims, total] = await Promise.all([
        welfareClaim_model_1.default.find(query)
            .populate("workerUser", "name phone email profilePicture")
            .populate("cooperative", "cooperativeName cooperativeEmail cooperativePhone")
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
    }, "Platform claims retrieved successfully");
}
/**
 * Super Admin audit / override action on a claim
 */
async function auditAdminClaim(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid claim ID", null, 400);
    }
    const claim = await welfareClaim_model_1.default.findById(id);
    if (!claim) {
        return (0, envelope_1.fail)(res, "Claim not found", null, 404);
    }
    const { auditAction, notes, newStatus, overrideAmountApproved } = req.body;
    if (!notes || !notes.trim()) {
        return (0, envelope_1.fail)(res, "Audit notes are required", null, 400);
    }
    const adminUser = await user_model_1.default.findById(userId).select("name");
    if (newStatus && Object.values(welfareClaim_model_1.WelfareClaimStatus).includes(newStatus)) {
        claim.status = newStatus;
    }
    if (overrideAmountApproved !== undefined) {
        const override = Number(overrideAmountApproved);
        if (!isNaN(override) && override >= 0) {
            claim.amountApproved = override;
        }
    }
    claim.auditLog.push({
        action: auditAction || "SUPERADMIN_AUDIT_REVIEW",
        performedBy: userId,
        performedByName: adminUser?.name || "Platform Super Administrator",
        performedByRole: "SUPERADMIN",
        timestamp: new Date(),
        notes: notes.trim(),
    });
    await claim.save();
    return (0, envelope_1.ok)(res, claim, "Claim audit review logged successfully");
}
/**
 * Get Welfare & Insurance policy configuration
 */
async function getPlatformWelfarePolicyConfig(_req, res) {
    return (0, envelope_1.ok)(res, welfare_service_1.PLATFORM_WELFARE_POLICY, "Platform policy configuration retrieved successfully");
}
//# sourceMappingURL=welfare.controller.js.map