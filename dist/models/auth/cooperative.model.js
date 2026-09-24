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
const worker_model_1 = require("./worker.model");
const cooperativeSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
        unique: true,
        index: true,
    },
    cooperativeName: {
        type: String,
        required: [true, "Cooperative name is required"],
        trim: true,
    },
    cooperativeAddress: {
        type: String,
        required: [true, "Cooperative address is required"],
        trim: true,
    },
    cooperativePhone: {
        type: String,
        required: [true, "Cooperative phone is required"],
        trim: true,
    },
    cooperativeEmail: {
        type: String,
        required: [true, "Cooperative email is required"],
        trim: true,
        lowercase: true,
    },
    verificationStatus: {
        type: String,
        enum: Object.values(worker_model_1.VerificationStatus),
        default: worker_model_1.VerificationStatus.PENDING,
        index: true,
    },
    rejectedReason: {
        type: String,
        trim: true,
    },
    cooperativeLogo: {
        url: {
            type: String,
            required: [true, "Cooperative logo URL is required"],
            trim: true,
        },
        publicId: {
            type: String,
            required: [true, "Cooperative logo public ID is required"],
            trim: true,
        },
    },
    verificationCertificate: {
        url: {
            type: String,
            required: [true, "Verification certificate URL is required"],
            trim: true,
        },
        publicId: {
            type: String,
            required: [true, "Verification certificate public ID is required"],
            trim: true,
        },
    },
}, {
    timestamps: true,
});
const Cooperative = mongoose_1.default.models.Cooperative ||
    mongoose_1.default.model("Cooperative", cooperativeSchema);
exports.default = Cooperative;
//# sourceMappingURL=cooperative.model.js.map