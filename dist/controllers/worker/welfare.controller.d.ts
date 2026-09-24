import { Request, Response } from "express";
import mongoose from "mongoose";
/**
 * Get worker's insurance policy overview, contribution stats, and claim summary
 */
export declare function getWorkerWelfareOverview(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        policy: {
            policyNumber: string;
            status: string;
            tier: string;
            underwriter: string;
            schemeName: string;
            coverage: {
                accidentalInjuryMax: number;
                hospitalizationMax: number;
                emergencyHardshipMax: number;
                toolEquipmentLossMax: number;
                healthCheckupAnnualMax: number;
            };
            features: string[];
        };
        contributions: {
            totalInsuranceAccrued: number;
            coveredJobsCompleted: any;
            totalHoursLogged: any;
        };
        claimsOverview: {
            totalClaimsCount: number;
            pendingClaimsCount: number;
            approvedClaimsCount: number;
            totalBenefitsReceived: number;
        };
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get all claims submitted by the logged-in worker
 */
export declare function getWorkerClaims(req: Request, res: Response): Promise<Response<{
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
 * Submit a new welfare or insurance claim
 */
export declare function fileWorkerClaim(req: Request, res: Response): Promise<Response<{
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
 * Get single claim details
 */
export declare function getWorkerClaimById(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: import("../../models/welfareClaim.model").IWelfareClaim & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=welfare.controller.d.ts.map