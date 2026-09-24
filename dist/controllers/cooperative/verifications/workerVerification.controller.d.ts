import { Request, Response } from "express";
import mongoose from "mongoose";
/**
 * Get all workers registered under the authenticated cooperative
 */
export declare function getCooperativeWorkers(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        cooperative: {
            _id: mongoose.Types.ObjectId;
            cooperativeName: string;
        };
        workers: (mongoose.Document<unknown, {}, import("../../../models/auth/worker.model").IWorker, {}, mongoose.DefaultSchemaOptions> & import("../../../models/auth/worker.model").IWorker & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        counts: {
            total: number;
            pending: number;
            approved: number;
            rejected: number;
        };
        pagination: {
            page: number;
            limit: number;
            totalItems: number;
            totalPages: number;
        };
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get details of a single worker registered under this cooperative
 */
export declare function getCooperativeWorkerById(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: mongoose.Document<unknown, {}, import("../../../models/auth/worker.model").IWorker, {}, mongoose.DefaultSchemaOptions> & import("../../../models/auth/worker.model").IWorker & Required<{
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
 * Approve or reject a worker application for this cooperative
 */
export declare function verifyWorker(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=workerVerification.controller.d.ts.map