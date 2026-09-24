import { Request, Response } from "express";
import mongoose from "mongoose";
/**
 * Get 7-day demand forecast and 24-hour peak curve for the cooperative
 */
export declare function getCooperativeForecastOverview(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        activeWorkers: number;
        workerDailyCapacity: number;
        total7DayProjectedGigs: number;
        deficitDaysCount: number;
        todaySummary: {
            predictedDemand: number;
            currentCapacity: number;
            gapStatus: "DEFICIT" | "OPTIMAL" | "SURPLUS";
            currentSurgeMultiplier: number;
            confidenceScore: number;
        };
        dailyForecast: {
            date: string;
            dayName: string;
            predictedDemand: number;
            workerCapacity: number;
            gap: number;
            gapStatus: "OPTIMAL" | "DEFICIT" | "SURPLUS";
            surgeMultiplier: number;
            confidence: number;
        }[];
        tomorrowHourlyCurve: {
            hour: number;
            timeLabel: string;
            surgeMultiplier: number;
            isPeak: boolean;
            suggestedWorkersNeeded: number;
        }[];
        cooperative: {
            id: mongoose.Types.ObjectId;
            name: string;
        };
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get category and trade demand distribution
 */
export declare function getCategoryDemandBreakdown(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        categoryId: string;
        categoryName: string;
        projectedGigsNext7Days: number;
        percentageShare: number;
        surgeRisk: "HIGH" | "LOW" | "MODERATE";
        surgeMultiplier: number;
        growthRatePercentage: number;
    }[];
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get zone-by-zone allocation matrix with capacity and deficit/surplus gaps
 */
export declare function getZoneAllocationMatrix(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        zoneName: string;
        predictedDemand: number;
        workerCapacity: number;
        gap: number;
        status: "DEFICIT" | "OPTIMAL" | "SURPLUS";
        recommendedAction: string;
        bountyIncentive: number;
    }[];
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get AI-recommended workforce rebalancing plans
 */
export declare function getRebalancePlans(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: (import("../../models/workforcePlan.model").IWorkforceRebalancePlan & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Execute or approve a workforce rebalance plan
 */
export declare function executeRebalancePlan(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: mongoose.Document<unknown, {}, import("../../models/workforcePlan.model").IWorkforceRebalancePlan, {}, mongoose.DefaultSchemaOptions> & import("../../models/workforcePlan.model").IWorkforceRebalancePlan & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get cooperative fair rotation metrics & gig distribution equity score
 */
export declare function getFairRotationMetrics(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        fairRotationScore: number;
        totalActiveMembers: number;
        highPriorityRotationWorkersCount: number;
        rotationRoster: {
            workerId: mongoose.Types.ObjectId;
            name: any;
            category: any;
            recentGigsCount: any;
            dispatchPriority: "BALANCED" | "HIGH" | "STANDBY";
            fairSharePercentage: number;
        }[];
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=forecasting.controller.d.ts.map