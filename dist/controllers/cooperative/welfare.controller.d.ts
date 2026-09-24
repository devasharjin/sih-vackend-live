import { Request, Response } from "express";
import mongoose from "mongoose";
/**
 * Get cooperative welfare fund statistics and reserve health
 */
export declare function getCooperativeWelfareStats(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        totalPoolCollected: number;
        totalDisbursedAmount: number;
        availableFundReserve: number;
        totalCompletedGigs: any;
        totalWorkersCovered: number;
        claimsStats: {
            totalClaimsCount: number;
            pendingReviewCount: number;
            pendingReviewAmount: number;
            approvedPendingDisbursementCount: number;
            rejectedCount: number;
        };
        policy: import("../../services/welfare.service").WelfarePolicyTier;
        cooperative: {
            id: mongoose.Types.ObjectId;
            name: string;
        };
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get all claims submitted by workers of this cooperative
 */
export declare function getCooperativeClaims(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
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
 * Update welfare claim status (UNDER_REVIEW, APPROVED, REJECTED, DISBURSED)
 */
export declare function updateCooperativeClaimStatus(req: Request, res: Response): Promise<Response<{
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
 * Direct emergency relief grant issued by cooperative to a worker
 */
export declare function issueEmergencyGrant(req: Request, res: Response): Promise<Response<{
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
 * Directory of cooperative workers with their insurance coverage details
 */
export declare function getCooperativeWorkerWelfareList(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        workers: {
            workerId: mongoose.Types.ObjectId;
            user: mongoose.Types.ObjectId;
            category: any;
            policyNumber: string;
            coverageStatus: string;
            experience: number;
            rating: number;
            completedJobs: any;
            totalInsuranceContributed: any;
        }[];
        total: number;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=welfare.controller.d.ts.map