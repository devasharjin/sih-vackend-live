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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WelfareUrgency = exports.WelfareClaimStatus = exports.WelfareClaimType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var WelfareClaimType;
(function (WelfareClaimType) {
    WelfareClaimType["ACCIDENTAL_INJURY"] = "ACCIDENTAL_INJURY";
    WelfareClaimType["MEDICAL_HOSPITALIZATION"] = "MEDICAL_HOSPITALIZATION";
    WelfareClaimType["EMERGENCY_HARDSHIP"] = "EMERGENCY_HARDSHIP";
    WelfareClaimType["TOOL_EQUIPMENT_LOSS"] = "TOOL_EQUIPMENT_LOSS";
    WelfareClaimType["HEALTH_CHECKUP"] = "HEALTH_CHECKUP";
})(WelfareClaimType || (exports.WelfareClaimType = WelfareClaimType = {}));
var WelfareClaimStatus;
(function (WelfareClaimStatus) {
    WelfareClaimStatus["SUBMITTED"] = "SUBMITTED";
    WelfareClaimStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    WelfareClaimStatus["APPROVED"] = "APPROVED";
    WelfareClaimStatus["REJECTED"] = "REJECTED";
    WelfareClaimStatus["DISBURSED"] = "DISBURSED";
})(WelfareClaimStatus || (exports.WelfareClaimStatus = WelfareClaimStatus = {}));
var WelfareUrgency;
(function (WelfareUrgency) {
    WelfareUrgency["STANDARD"] = "STANDARD";
    WelfareUrgency["URGENT"] = "URGENT";
    WelfareUrgency["CRITICAL"] = "CRITICAL";
})(WelfareUrgency || (exports.WelfareUrgency = WelfareUrgency = {}));
const generateClaimNumber = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `CLM-${dateStr}-${randomSuffix}`;
};
const welfareClaimSchema = new mongoose_1.Schema({
    claimNumber: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        default: generateClaimNumber,
        index: true,
    },
    worker: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Worker",
        required: [true, "Worker reference is required"],
        index: true,
    },
    workerUser: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Worker user reference is required"],
        index: true,
    },
    cooperative: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Cooperative",
        required: [true, "Cooperative reference is required"],
        index: true,
    },
    booking: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Booking",
        sparse: true,
        index: true,
    },
    claimType: {
        type: String,
        enum: Object.values(WelfareClaimType),
        required: [true, "Claim type is required"],
        index: true,
    },
    urgency: {
        type: String,
        enum: Object.values(WelfareUrgency),
        default: WelfareUrgency.STANDARD,
        index: true,
    },
    title: {
        type: String,
        required: [true, "Claim title is required"],
        trim: true,
        maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
        type: String,
        required: [true, "Detailed incident description is required"],
        trim: true,
    },
    incidentDate: {
        type: Date,
        required: [true, "Incident date is required"],
        default: Date.now,
    },
    amountRequested: {
        type: Number,
        required: [true, "Requested claim amount is required"],
        min: [100, "Minimum claim request amount is ₹100"],
    },
    amountApproved: {
        type: Number,
        min: [0, "Approved amount cannot be negative"],
    },
    amountDisbursed: {
        type: Number,
        min: [0, "Disbursed amount cannot be negative"],
    },
    status: {
        type: String,
        enum: Object.values(WelfareClaimStatus),
        default: WelfareClaimStatus.SUBMITTED,
        index: true,
    },
    reviewNotes: {
        type: String,
        trim: true,
    },
    rejectionReason: {
        type: String,
        trim: true,
    },
    documents: [
        {
            title: { type: String, required: true },
            url: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now },
        },
    ],
    disbursedAt: {
        type: Date,
    },
    disbursementTxnId: {
        type: String,
        trim: true,
    },
    disbursementMethod: {
        type: String,
        trim: true,
        default: "COOPERATIVE_DIRECT_TRANSFER",
    },
    auditLog: [
        {
            action: { type: String, required: true },
            performedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
            performedByName: { type: String },
            performedByRole: { type: String },
            timestamp: { type: Date, default: Date.now },
            notes: { type: String },
        },
    ],
}, {
    timestamps: true,
});
// Compound indexes for rapid role-based lookups
welfareClaimSchema.index({ cooperative: 1, status: 1, createdAt: -1 });
welfareClaimSchema.index({ worker: 1, status: 1, createdAt: -1 });
welfareClaimSchema.index({ status: 1, urgency: 1, createdAt: -1 });
const WelfareClaim = mongoose_1.default.model("WelfareClaim", welfareClaimSchema);
exports.default = WelfareClaim;
//# sourceMappingURL=welfareClaim.model.js.map