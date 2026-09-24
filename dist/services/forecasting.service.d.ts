import mongoose, { Types } from "mongoose";
export declare const ZONES: string[];
export declare const HOURLY_SURGE_WEIGHTS: Record<number, number>;
export declare const DAY_OF_WEEK_WEIGHTS: Record<number, number>;
export declare class ForecastingService {
    /**
     * Generates 7-day demand and workforce capacity overview for a cooperative
     * Aggregates REAL booking and worker documents from MongoDB.
     */
    static getCooperativeForecastOverview(cooperativeId: Types.ObjectId): Promise<{
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
    }>;
    /**
     * Generates forecasted demand broken down by real service trade categories from MongoDB
     */
    static getCategoryDemandBreakdown(_cooperativeId?: Types.ObjectId): Promise<{
        categoryId: string;
        categoryName: string;
        projectedGigsNext7Days: number;
        percentageShare: number;
        surgeRisk: "HIGH" | "LOW" | "MODERATE";
        surgeMultiplier: number;
        growthRatePercentage: number;
    }[]>;
    /**
     * Generates zone-level demand density, active worker counts, and deficit gaps
     * using real booking locations from MongoDB.
     */
    static getZoneAllocationMatrix(cooperativeId?: Types.ObjectId): Promise<{
        zoneName: string;
        predictedDemand: number;
        workerCapacity: number;
        gap: number;
        status: "DEFICIT" | "OPTIMAL" | "SURPLUS";
        recommendedAction: string;
        bountyIncentive: number;
    }[]>;
    /**
     * Generates AI Workforce Rebalancing Recommendations backed by MongoDB WorkforcePlan documents
     */
    static getRebalanceRecommendations(cooperativeId: Types.ObjectId): Promise<(import("../models/workforcePlan.model").IWorkforceRebalancePlan & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * Execute an AI Rebalance Plan
     */
    static executeRebalancePlan(planId: string, cooperativeId: Types.ObjectId, userId: Types.ObjectId): Promise<mongoose.Document<unknown, {}, import("../models/workforcePlan.model").IWorkforceRebalancePlan, {}, mongoose.DefaultSchemaOptions> & import("../models/workforcePlan.model").IWorkforceRebalancePlan & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    /**
     * Computes Member Gig Distribution Equality & Fair Rotation Index
     * Directly queries real Worker and Booking models from MongoDB.
     */
    static getFairRotationMetrics(cooperativeId: Types.ObjectId): Promise<{
        fairRotationScore: number;
        totalActiveMembers: number;
        highPriorityRotationWorkersCount: number;
        rotationRoster: {
            workerId: Types.ObjectId;
            name: any;
            category: any;
            recentGigsCount: any;
            dispatchPriority: "BALANCED" | "HIGH" | "STANDBY";
            fairSharePercentage: number;
        }[];
    }>;
    /**
     * Generates AI Surge Hotspots for Workers directly derived from real booking locations
     */
    static getWorkerHotspots(): Promise<{
        zoneName: any;
        surgeFactor: number;
        peakHours: string;
        activeDemandLevel: "HIGH_SURGE" | "MODERATE" | "LOW";
        topTrade: string;
        bonusEstimate: string;
        recommendation: string;
    }[]>;
    /**
     * Generates Personalized Smart Shift Advice for a Worker using their real profile and trade
     */
    static getWorkerSmartShifts(workerId: Types.ObjectId): Promise<{
        workerId: Types.ObjectId;
        recommendedShift: {
            day: string;
            timeSlot: string;
            expectedGigMultiplier: number;
            estimatedEarningsBoost: string;
            priorityStatus: string;
            reason: string;
        };
        activeSurgeBounties: {
            title: string;
            zone: string;
            bonus: string;
            validUntil: string;
        }[];
    }>;
    /**
     * Platform Macro Demand Matrix for Super Admin directly querying real MongoDB collections
     */
    static getPlatformMacroForecast(): Promise<{
        platformForecasted7DayTotal: number;
        activePlatformWorkforce: number;
        totalHistoricalGigsFulfilled: number;
        modelHealth: {
            accuracyScore: number;
            mapeScore: number;
            trainingSamples: number;
            modelArchitecture: string;
            lastCalibratedAt: string;
            environmentalFactorsActive: string[];
        };
        crossCooperativeExchanges: {
            sourceCooperative: string;
            targetCooperative: string;
            recommendedWorkers: number;
            trade: string;
            reason: string;
            status: string;
        }[];
    }>;
}
//# sourceMappingURL=forecasting.service.d.ts.map