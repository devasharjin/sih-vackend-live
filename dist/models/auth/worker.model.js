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
exports.VerificationStatus = exports.AvailabilityStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var AvailabilityStatus;
(function (AvailabilityStatus) {
    AvailabilityStatus["FULL_TIME"] = "Full-Time";
    AvailabilityStatus["PART_TIME"] = "Part-Time";
})(AvailabilityStatus || (exports.AvailabilityStatus = AvailabilityStatus = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "Pending";
    VerificationStatus["APPROVED"] = "Approved";
    VerificationStatus["REJECTED"] = "Rejected";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
const WorkerSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
    },
    cooperativeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Cooperative",
        required: [true, "Cooperative ID is required"],
        index: true,
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: false,
        index: true,
    },
    categories: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Category",
        },
    ],
    skills: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Service",
        },
    ],
    availability: {
        type: String,
        enum: Object.values(AvailabilityStatus),
        default: AvailabilityStatus.FULL_TIME,
        required: true,
    },
    verificationStatus: {
        type: String,
        enum: Object.values(VerificationStatus),
        default: VerificationStatus.PENDING,
        required: true,
        index: true,
    },
    verificationDocuments: {
        identity: {
            url: {
                type: String,
                required: true,
                trim: true,
            },
            status: {
                type: String,
                enum: Object.values(VerificationStatus),
                default: VerificationStatus.PENDING,
            },
            rejectionReason: {
                type: String,
                trim: true,
            },
        },
        certificate: {
            url: {
                type: String,
                required: true,
                trim: true,
            },
            status: {
                type: String,
                enum: Object.values(VerificationStatus),
                default: VerificationStatus.PENDING,
            },
            rejectionReason: {
                type: String,
                trim: true,
            },
        },
    },
    experience: {
        type: Number,
        min: 0,
        default: 0,
    },
    location: {
        address: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pincode: {
            type: String,
            required: true,
        },
        latitude: {
            type: Number,
            default: 0.0,
        },
        longitude: {
            type: Number,
            default: 0.0,
        },
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
    },
    totalJobsCompleted: {
        type: Number,
        min: 0,
        default: 0,
    },
    weeklyServiceLimit: {
        type: Number,
        min: 1,
        default: 6,
    },
    weeklyAcceptedCount: {
        type: Number,
        min: 0,
        default: 0,
    },
    weeklyResetDate: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
WorkerSchema.index({
    verificationStatus: 1,
    isActive: 1,
});
WorkerSchema.index({
    skills: 1,
});
const Worker = mongoose_1.default.models.Worker ||
    mongoose_1.default.model("Worker", WorkerSchema);
exports.default = Worker;
//# sourceMappingURL=worker.model.js.map