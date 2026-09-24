import { Request, Response } from "express";
import mongoose from "mongoose";
/**
 * Get AI demand surge hotspots and active zone multipliers for workers
 */
export declare function getWorkerDemandHotspots(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        zoneName: any;
        surgeFactor: number;
        peakHours: string;
        activeDemandLevel: "HIGH_SURGE" | "MODERATE" | "LOW";
        topTrade: string;
        bonusEstimate: string;
        recommendation: string;
    }[];
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get AI personalized smart shift recommendation for the logged in worker
 */
export declare function getWorkerSmartShifts(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        workerId: mongoose.Types.ObjectId;
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
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=forecasting.controller.d.ts.map