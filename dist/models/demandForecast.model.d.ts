import { Document, Model, Types } from "mongoose";
export declare enum ForecastTimeHorizon {
    HOURS_24 = "24_HOURS",
    DAYS_7 = "7_DAYS",
    DAYS_30 = "30_DAYS"
}
export declare enum WorkforceGapStatus {
    OPTIMAL = "OPTIMAL",
    DEFICIT = "DEFICIT",
    SURPLUS = "SURPLUS"
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
declare const DemandForecast: Model<IDemandForecastSnapshot>;
export default DemandForecast;
//# sourceMappingURL=demandForecast.model.d.ts.map