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
const mongoose_1 = __importStar(require("mongoose"));
const billing_service_1 = require("../services/billing.service");
const serviceSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Service name is required"],
        trim: true,
        minlength: [2, "Service name must be at least 2 characters"],
        maxlength: [100, "Service name cannot exceed 100 characters"],
        unique: true,
    },
    description: {
        type: String,
        required: [true, "Service description is required"],
        trim: true,
        maxlength: [1000, "Service description cannot exceed 1000 characters"],
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: false,
        index: true,
    },
    icon: {
        type: String,
        trim: true,
        default: "",
    },
    priceType: {
        type: String,
        enum: {
            values: ["hourly", "meters"],
            message: "Price type must be either hourly or meters",
        },
        default: "hourly",
        required: [true, "Price type is required"],
    },
    firstHourRate: {
        type: Number,
        min: [0, "First hour rate cannot be negative"],
        default: function () {
            return this.hourlyPrice ?? 0;
        },
    },
    additionalHourRate: {
        type: Number,
        min: [0, "Additional hour rate cannot be negative"],
        default: function () {
            return this.firstHourRate ?? this.hourlyPrice ?? 0;
        },
    },
    transportFee: {
        type: Number,
        default: billing_service_1.FIXED_TRANSPORT_FEE,
        immutable: true, // Fixed centrally at ₹30
    },
    cooperativeShare: {
        type: Number,
        min: [0, "Cooperative admin share cannot be negative"],
        max: [100, "Cooperative admin share cannot exceed 100%"],
        default: 10,
    },
    insuranceShare: {
        type: Number,
        min: [0, "Insurance share cannot be negative"],
        max: [100, "Insurance share cannot exceed 100%"],
        default: 5,
    },
    hourlyPrice: {
        type: Number,
        min: [0, "Hourly price cannot be negative"],
    },
    metersPrice: {
        type: Number,
        min: [0, "Meters price cannot be negative"],
    },
    emergencyAvailable: {
        type: Boolean,
        default: true,
        index: true,
    },
    emergencyFee: {
        type: Number,
        min: [0, "Emergency fee cannot be negative"],
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});
// Validate combined cooperative and insurance share percentages
serviceSchema.pre("validate", function () {
    const coop = this.cooperativeShare ?? 0;
    const ins = this.insuranceShare ?? 0;
    if (coop + ins > 100) {
        throw new Error("Combined cooperative and insurance share cannot exceed 100%");
    }
});
const Service = mongoose_1.default.models.Service || mongoose_1.default.model("Service", serviceSchema);
exports.default = Service;
//# sourceMappingURL=service.model.js.map