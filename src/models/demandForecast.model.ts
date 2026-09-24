import mongoose, { Document, Model, Schema, Types } from "mongoose";

export enum ForecastTimeHorizon {
  HOURS_24 = "24_HOURS",
  DAYS_7 = "7_DAYS",
  DAYS_30 = "30_DAYS",
}

export enum WorkforceGapStatus {
  OPTIMAL = "OPTIMAL",
  DEFICIT = "DEFICIT",
  SURPLUS = "SURPLUS",
}

export interface IEnvironmentalFactors {
  weather: string;
  festivalSeason: boolean;
  tempModifier: number;
}

export interface IDemandForecastSnapshot extends Document {
  targetDate: Date;
  timeHorizon: ForecastTimeHorizon;
  cooperative?: Types.ObjectId;
  category?: Types.ObjectId;
  categoryName?: string;
  zone: string;
  predictedBookings: number;
  confidenceScore: number;
  surgeMultiplier: number;
  currentWorkerCapacity: number;
  workforceGap: number;
  gapStatus: WorkforceGapStatus;
  environmentalFactors: IEnvironmentalFactors;
  recommendedWorkersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const demandForecastSchema = new Schema<IDemandForecastSnapshot>(
  {
    targetDate: {
      type: Date,
      required: true,
      index: true,
    },
    timeHorizon: {
      type: String,
      enum: Object.values(ForecastTimeHorizon),
      default: ForecastTimeHorizon.DAYS_7,
      index: true,
    },
    cooperative: {
      type: Schema.Types.ObjectId,
      ref: "Cooperative",
      sparse: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      sparse: true,
      index: true,
    },
    categoryName: {
      type: String,
      trim: true,
    },
    zone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    predictedBookings: {
      type: Number,
      required: true,
      min: 0,
    },
    confidenceScore: {
      type: Number,
      default: 0.92,
      min: 0,
      max: 1,
    },
    surgeMultiplier: {
      type: Number,
      default: 1.0,
      min: 1.0,
    },
    currentWorkerCapacity: {
      type: Number,
      required: true,
      min: 0,
    },
    workforceGap: {
      type: Number,
      required: true,
    },
    gapStatus: {
      type: String,
      enum: Object.values(WorkforceGapStatus),
      required: true,
      index: true,
    },
    environmentalFactors: {
      weather: { type: String, default: "Clear / Normal" },
      festivalSeason: { type: Boolean, default: false },
      tempModifier: { type: Number, default: 1.0 },
    },
    recommendedWorkersCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

demandForecastSchema.index({ cooperative: 1, targetDate: 1, zone: 1 });
demandForecastSchema.index({ targetDate: 1, timeHorizon: 1 });

const DemandForecast: Model<IDemandForecastSnapshot> = mongoose.model<IDemandForecastSnapshot>(
  "DemandForecast",
  demandForecastSchema
);

export default DemandForecast;
