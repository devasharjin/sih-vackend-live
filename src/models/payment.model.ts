import mongoose, { Document, Model, Schema, Types } from "mongoose";

export enum PaymentRecordStatus {
  CREATED = "CREATED",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export interface IPayment extends Document {
  booking: Types.ObjectId;
  customer: Types.ObjectId;
  worker?: Types.ObjectId;
  cooperative?: Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number; // in INR
  currency: string;
  status: PaymentRecordStatus;
  paymentMethod?: string;
  receipt?: string;
  errorDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking reference is required"],
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer reference is required"],
      index: true,
    },
    worker: {
      type: Schema.Types.ObjectId,
      ref: "Worker",
      index: true,
    },
    cooperative: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ booking: 1, status: 1 });

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
