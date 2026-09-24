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
exports.PaymentRecordStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var PaymentRecordStatus;
(function (PaymentRecordStatus) {
    PaymentRecordStatus["CREATED"] = "CREATED";
    PaymentRecordStatus["PAID"] = "PAID";
    PaymentRecordStatus["FAILED"] = "FAILED";
    PaymentRecordStatus["REFUNDED"] = "REFUNDED";
})(PaymentRecordStatus || (exports.PaymentRecordStatus = PaymentRecordStatus = {}));
const paymentSchema = new mongoose_1.Schema({
    booking: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Booking",
        required: [true, "Booking reference is required"],
        index: true,
    },
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Customer reference is required"],
        index: true,
    },
    worker: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Worker",
        index: true,
    },
    cooperative: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Cooperative",
        index: true,
    },
    razorpayOrderId: {
        type: String,
        required: [true, "Razorpay Order ID is required"],
        unique: true,
        trim: true,
    },
    razorpayPaymentId: {
        type: String,
        trim: true,
        sparse: true,
        index: true,
    },
    razorpaySignature: {
        type: String,
        trim: true,
    },
    amount: {
        type: Number,
        required: [true, "Payment amount is required"],
        min: [0, "Amount cannot be negative"],
    },
    currency: {
        type: String,
        default: "INR",
        uppercase: true,
    },
    status: {
        type: String,
        enum: Object.values(PaymentRecordStatus),
        default: PaymentRecordStatus.CREATED,
        index: true,
    },
    paymentMethod: {
        type: String,
        trim: true,
        default: "",
    },
    receipt: {
        type: String,
        trim: true,
    },
    errorDescription: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ booking: 1, status: 1 });
const Payment = mongoose_1.default.models.Payment || mongoose_1.default.model("Payment", paymentSchema);
exports.default = Payment;
//# sourceMappingURL=payment.model.js.map