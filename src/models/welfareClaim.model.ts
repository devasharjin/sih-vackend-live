import mongoose, { Document, Model, Schema, Types } from "mongoose";

export enum WelfareClaimType {
  ACCIDENTAL_INJURY = "ACCIDENTAL_INJURY",
  MEDICAL_HOSPITALIZATION = "MEDICAL_HOSPITALIZATION",
  EMERGENCY_HARDSHIP = "EMERGENCY_HARDSHIP",
  TOOL_EQUIPMENT_LOSS = "TOOL_EQUIPMENT_LOSS",
  HEALTH_CHECKUP = "HEALTH_CHECKUP",
}

export enum WelfareClaimStatus {
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  DISBURSED = "DISBURSED",
}

export enum WelfareUrgency {
  STANDARD = "STANDARD",
  URGENT = "URGENT",
  CRITICAL = "CRITICAL",
}

export interface IWelfareDocument {
  title: string;
  url: string;
  uploadedAt: Date;
}

export interface IWelfareAuditEntry {
  action: string;
  performedBy: Types.ObjectId;
  performedByName?: string;
  performedByRole?: string;
  timestamp: Date;
  notes?: string;
}

export interface IWelfareClaim extends Document {
  claimNumber: string;
  worker: Types.ObjectId;
  workerUser: Types.ObjectId;
  cooperative: Types.ObjectId;
  booking?: Types.ObjectId;

  claimType: WelfareClaimType;
  urgency: WelfareUrgency;
  title: string;
  description: string;
  incidentDate: Date;

  amountRequested: number;
  amountApproved?: number;
  amountDisbursed?: number;

  status: WelfareClaimStatus;
  reviewNotes?: string;
  rejectionReason?: string;

  documents: IWelfareDocument[];

  disbursedAt?: Date;
  disbursementTxnId?: string;
  disbursementMethod?: string;

  auditLog: IWelfareAuditEntry[];

  createdAt: Date;
  updatedAt: Date;
}

const generateClaimNumber = (): string => {
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `CLM-${dateStr}-${randomSuffix}`;
};

const welfareClaimSchema = new Schema<IWelfareClaim>(
  {
    claimNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      default: generateClaimNumber,
      index: true,
    },
    worker: {
      type: Schema.Types.ObjectId,
      ref: "Worker",
      required: [true, "Worker reference is required"],
      index: true,
    },
    workerUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Worker user reference is required"],
      index: true,
    },
    cooperative: {
      type: Schema.Types.ObjectId,
      ref: "Cooperative",
      required: [true, "Cooperative reference is required"],
      index: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
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
        performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        performedByName: { type: String },
        performedByRole: { type: String },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for rapid role-based lookups
welfareClaimSchema.index({ cooperative: 1, status: 1, createdAt: -1 });
welfareClaimSchema.index({ worker: 1, status: 1, createdAt: -1 });
welfareClaimSchema.index({ status: 1, urgency: 1, createdAt: -1 });

const WelfareClaim: Model<IWelfareClaim> = mongoose.model<IWelfareClaim>(
  "WelfareClaim",
  welfareClaimSchema
);

export default WelfareClaim;
