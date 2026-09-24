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
exports.InquiryStatus = exports.InquiryCategory = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var InquiryCategory;
(function (InquiryCategory) {
    InquiryCategory["BOOKING_SERVICES"] = "Booking & Services";
    InquiryCategory["WORKER_AFFILIATION"] = "Worker Affiliation";
    InquiryCategory["COOPERATIVE_SOCIETY"] = "Cooperative Society";
    InquiryCategory["BILLING_PAYMENTS"] = "Billing & Payments";
    InquiryCategory["TECHNICAL_SUPPORT"] = "Technical Support";
    InquiryCategory["GENERAL_INQUIRY"] = "General Inquiry";
})(InquiryCategory || (exports.InquiryCategory = InquiryCategory = {}));
var InquiryStatus;
(function (InquiryStatus) {
    InquiryStatus["NEW"] = "NEW";
    InquiryStatus["IN_PROGRESS"] = "IN_PROGRESS";
    InquiryStatus["RESOLVED"] = "RESOLVED";
})(InquiryStatus || (exports.InquiryStatus = InquiryStatus = {}));
const generateTicketNumber = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `TKT-${dateStr}-${randomSuffix}`;
};
const contactMessageSchema = new mongoose_1.Schema({
    ticketNumber: {
        type: String,
        unique: true,
        required: true,
        default: generateTicketNumber,
        index: true,
    },
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
        type: String,
        required: [true, "Email address is required"],
        trim: true,
        lowercase: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Please provide a valid email address",
        ],
    },
    phone: {
        type: String,
        trim: true,
        default: "",
    },
    category: {
        type: String,
        enum: Object.values(InquiryCategory),
        default: InquiryCategory.GENERAL_INQUIRY,
    },
    subject: {
        type: String,
        required: [true, "Subject is required"],
        trim: true,
        maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    message: {
        type: String,
        required: [true, "Message is required"],
        trim: true,
        maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    status: {
        type: String,
        enum: Object.values(InquiryStatus),
        default: InquiryStatus.NEW,
        index: true,
    },
}, {
    timestamps: true,
});
const ContactMessage = mongoose_1.default.models.ContactMessage ||
    mongoose_1.default.model("ContactMessage", contactMessageSchema);
exports.default = ContactMessage;
//# sourceMappingURL=contact.model.js.map