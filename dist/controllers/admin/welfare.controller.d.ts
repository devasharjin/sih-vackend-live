import { Request, Response } from "express";
import mongoose from "mongoose";
/**
 * Get platform-wide insurance fund reserve health and claims metrics
 */
export declare function getPlatformWelfareStats(_req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: {
        totalInsurancePool: number;
        totalSettledAmount: number;
        availableReserve: number;
        lossRatio: number;
        pendingLiability: number;
        totalCompletedJobs: any;
        totalWorkersEnrolled: number;
        claimsOverview: {
            totalClaimsCount: number;
            pendingClaimsCount: number;
            settledClaimsCount: number;
        };
        policyConfig: import("../../services/welfare.service").WelfarePolicyTier;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get all claims across the platform with filtering, search, and pagination
 */
export declare function getAdminClaims(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: {
        claims: (import("../../models/welfareClaim.model").IWelfareClaim & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Super Admin audit / override action on a claim
 */
export declare function auditAdminClaim(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: mongoose.Document<unknown, {}, import("../../models/welfareClaim.model").IWelfareClaim, {}, mongoose.DefaultSchemaOptions> & import("../../models/welfareClaim.model").IWelfareClaim & Required<{
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
 * Get Welfare & Insurance policy configuration
 */
export declare function getPlatformWelfarePolicyConfig(_req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: import("../../services/welfare.service").WelfarePolicyTier;
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=welfare.controller.d.ts.map