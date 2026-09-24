import mongoose, { Document, Model, Schema, Types } from "mongoose";

export enum RebalancePlanStatus {
  RECOMMENDED = "RECOMMENDED",
  APPROVED = "APPROVED",
  EXECUTED = "EXECUTED",
  DISMISSED = "DISMISSED",
}

export interface IWorkforceRebalancePlan extends Document {
  planNumber: string;
  cooperative: Types.ObjectId;
  title: string;
  targetDate: Date;
  targetTrade: string;
  sourceZone: string;
  targetZone: string;
  recommendedWorkersCount: number;
  surgeBonusPerWorker: number;
  status: RebalancePlanStatus;
  aiRationale: string;
  mobilizedWorkers: Types.ObjectId[];
  executedAt?: Date;
  executedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const generatePlanNumber = (): string => {
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `WFP-${dateStr}-${randomSuffix}`;
};

const workforcePlanSchema = new Schema<IWorkforceRebalancePlan>(
  {
    planNumber: {
      type: String,
      unique: true,
      required: true,
      default: generatePlanNumber,
      index: true,
    },
    cooperative: {
      type: Schema.Types.ObjectId,
      ref: "Cooperative",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    targetDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    targetTrade: {
      type: String,
      required: true,
      trim: true,
    },
    sourceZone: {
      type: String,
      required: true,
      trim: true,
    },
    targetZone: {
      type: String,
      required: true,
      trim: true,
    },
    recommendedWorkersCount: {
      type: Number,
      required: true,
      min: 1,
    },
    surgeBonusPerWorker: {
      type: Number,
      default: 50,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(RebalancePlanStatus),
      default: RebalancePlanStatus.RECOMMENDED,
      index: true,
    },
    aiRationale: {
      type: String,
      required: true,
      trim: true,
    },
    mobilizedWorkers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Worker",
      },
    ],
    executedAt: {
      type: Date,
    },
    executedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

workforcePlanSchema.index({ cooperative: 1, status: 1, targetDate: -1 });

const WorkforceRebalancePlan: Model<IWorkforceRebalancePlan> = mongoose.model<IWorkforceRebalancePlan>(
  "WorkforceRebalancePlan",
  workforcePlanSchema
);

export default WorkforceRebalancePlan;
