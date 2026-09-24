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
exports.UrgencyLevel = exports.BookingType = exports.CancelledByRole = exports.PaymentStatus = exports.BookingStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "PENDING";
    BookingStatus["ASSIGNED"] = "ASSIGNED";
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["IN_PROGRESS"] = "IN_PROGRESS";
    BookingStatus["COMPLETED"] = "COMPLETED";
    BookingStatus["CANCELLED"] = "CANCELLED";
    BookingStatus["REJECTED"] = "REJECTED";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var CancelledByRole;
(function (CancelledByRole) {
    CancelledByRole["CUSTOMER"] = "CUSTOMER";
    CancelledByRole["WORKER"] = "WORKER";
    CancelledByRole["COOPERATIVE"] = "COOPERATIVE";
    CancelledByRole["SUPERADMIN"] = "SUPERADMIN";
})(CancelledByRole || (exports.CancelledByRole = CancelledByRole = {}));
var BookingType;
(function (BookingType) {
    BookingType["SCHEDULED"] = "SCHEDULED";
    BookingType["PREMIUM"] = "PREMIUM";
    BookingType["ON_DEMAND"] = "ON_DEMAND";
    BookingType["EMERGENCY"] = "EMERGENCY";
})(BookingType || (exports.BookingType = BookingType = {}));
var UrgencyLevel;
(function (UrgencyLevel) {
    UrgencyLevel["STANDARD"] = "STANDARD";
    UrgencyLevel["HIGH"] = "HIGH";
    UrgencyLevel["CRITICAL"] = "CRITICAL";
})(UrgencyLevel || (exports.UrgencyLevel = UrgencyLevel = {}));
const generateBookingNumber = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `BKG-${dateStr}-${randomSuffix}`;
};
const bookingSchema = new mongoose_1.Schema({
    bookingNumber: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        default: generateBookingNumber,
        index: true,
    },
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Customer reference is required"],
        index: true,
        alias: "customerId",
    },
    service: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Service",
        required: [true, "Service reference is required"],
        index: true,
        alias: "serviceId",
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        index: true,
        alias: "categoryId",
    },
    cooperative: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Cooperative",
        index: true,
        alias: "cooperativeId",
    },
    worker: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Worker",
        index: true,
        alias: "workerId",
    },
    address: {
        street: {
            type: String,
            required: [true, "Street / address is required"],
            trim: true,
        },
        city: {
            type: String,
            trim: true,
            default: "",
        },
        state: {
            type: String,
            trim: true,
            default: "",
        },
        pincode: {
            type: String,
            trim: true,
            default: "",
        },
        landmark: {
            type: String,
            trim: true,
            default: "",
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                default: [0, 0],
            },
        },
    },
    scheduledDate: {
        type: Date,
        required: [true, "Scheduled date and time is required"],
        index: true,
    },
    customerNotes: {
        type: String,
        trim: true,
        maxlength: [1000, "Notes cannot exceed 1000 characters"],
        default: "",
    },
    bookingType: {
        type: String,
        enum: Object.values(BookingType),
        default: BookingType.SCHEDULED,
        index: true,
    },
    isEmergency: {
        type: Boolean,
        default: false,
        index: true,
    },
    urgencyLevel: {
        type: String,
        enum: Object.values(UrgencyLevel),
        default: UrgencyLevel.STANDARD,
    },
    emergencyDetails: {
        hazardType: { type: String, trim: true },
        severity: { type: String, trim: true },
        immediateContact: { type: String, trim: true, default: "" },
        notes: { type: String, trim: true, default: "" },
    },
    priceType: {
        type: String,
        enum: {
            values: ["hourly", "meters"],
            message: "Price type must be either hourly or meters",
        },
        required: [true, "Price type is required"],
    },
    rate: {
        type: Number,
        required: [true, "Service rate is required"],
        min: [0, "Rate cannot be negative"],
    },
    units: {
        type: Number,
        default: 1,
        min: [0.1, "Units must be at least 0.1"],
    },
    totalAmount: {
        type: Number,
        required: [true, "Total amount is required"],
        min: [0, "Total amount cannot be negative"],
    },
    pricing: {
        firstHourRate: { type: Number, default: 0 },
        additionalHourRate: { type: Number, default: 0 },
        transportFee: { type: Number, default: 30 },
        cooperativePercentage: { type: Number, default: 10 },
        insurancePercentage: { type: Number, default: 5 },
        actualDurationMinutes: { type: Number, default: 0 },
        billableHours: { type: Number, default: 1 },
        firstHourCharge: { type: Number, default: 0 },
        additionalHoursCharge: { type: Number, default: 0 },
        serviceAmount: { type: Number, default: 0 },
        cooperativeShareAmount: { type: Number, default: 0 },
        insuranceShareAmount: { type: Number, default: 0 },
        workerNetEarnings: { type: Number, default: 0 },
        customerTotalAmount: { type: Number, default: 0 },
        isFinalized: { type: Boolean, default: false },
    },
    paymentStatus: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.PENDING,
        index: true,
    },
    paymentDetails: {
        transactionId: {
            type: String,
            trim: true,
        },
        paidAt: {
            type: Date,
        },
    },
    status: {
        type: String,
        enum: Object.values(BookingStatus),
        default: BookingStatus.PENDING,
        index: true,
    },
    assignedAt: {
        type: Date,
    },
    startedAt: {
        type: Date,
    },
    completedAt: {
        type: Date,
    },
    cancelledAt: {
        type: Date,
    },
    cancellationReason: {
        type: String,
        trim: true,
        maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
    },
    cancelledBy: {
        type: String,
        enum: Object.values(CancelledByRole),
    },
    rating: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Rating",
        alias: "ratingId",
    },
    isRated: {
        type: Boolean,
        default: false,
        index: true,
    },
}, {
    timestamps: true,
});
// Compound indexes for optimal performance across dashboard queries
bookingSchema.index({ isEmergency: -1, status: 1, createdAt: -1 });
bookingSchema.index({ bookingType: 1, status: 1 });
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ worker: 1, status: 1 });
bookingSchema.index({ cooperative: 1, status: 1 });
bookingSchema.index({ status: 1, scheduledDate: 1 });
bookingSchema.index({ createdAt: -1 });
const Booking = mongoose_1.default.models.Booking || mongoose_1.default.model("Booking", bookingSchema);
exports.default = Booking;
//# sourceMappingURL=booking.model.js.map