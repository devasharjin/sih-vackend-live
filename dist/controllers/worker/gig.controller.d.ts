import { Request, Response } from "express";
import mongoose from "mongoose";
export declare function getAvailableGigs(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: any[];
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function getMyJobs(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: any[];
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function getWorkerJobById(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function acceptGig(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function updateJobStatus(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function getWorkerStats(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        activeJobs: number;
        completedJobs: number;
        availableGigs: number;
        totalEarnings: any;
        rating: number;
        totalJobsCompleted: number;
        verificationStatus: import("../../models/auth/worker.model").VerificationStatus;
        cancellationsToday: number;
        cancellationLimit: number;
        canCancelToday: boolean;
        weeklyServiceLimit: any;
        weeklyAcceptedCount: number;
        weeklyServicesRemaining: number;
        canAcceptWeeklyService: boolean;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function updateWorkerProfile(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        user: (mongoose.Document<unknown, {}, import("../../models/auth/user.model").IUser, {}, mongoose.DefaultSchemaOptions> & import("../../models/auth/user.model").IUser & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
        worker: (mongoose.Document<unknown, {}, import("../../models/auth/worker.model").IWorker, {}, mongoose.DefaultSchemaOptions> & import("../../models/auth/worker.model").IWorker & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
        profile: (mongoose.Document<unknown, {}, import("../../models/auth/worker.model").IWorker, {}, mongoose.DefaultSchemaOptions> & import("../../models/auth/worker.model").IWorker & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=gig.controller.d.ts.map