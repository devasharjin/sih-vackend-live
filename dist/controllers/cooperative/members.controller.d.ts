import { Request, Response } from "express";
import mongoose from "mongoose";
/**
 * List all member workers with search, filters, pagination, and KPI counts
 */
export declare function getCooperativeMembers(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        members: (import("../../models/auth/worker.model").IWorker & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        stats: {
            totalMembers: number;
            activeOnDuty: number;
            inactiveCount: number;
            fullTimeCount: number;
            partTimeCount: number;
            pendingVerificationCount: number;
            averageRating: number;
            totalJobsCompleted: any;
        };
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Toggle active status or availability of a member worker
 */
export declare function toggleMemberStatus(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get single member dossier with historical jobs, claims, and verification documents
 */
export declare function getMemberDetails(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        member: import("../../models/auth/worker.model").IWorker & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        };
        recentGigs: (import("../../models/booking.model").IBooking & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        welfareClaims: (import("../../models/welfareClaim.model").IWelfareClaim & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=members.controller.d.ts.map