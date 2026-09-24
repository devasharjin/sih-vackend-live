import { Request, Response } from "express";
import mongoose from "mongoose";
/**
 * Get cooperative specific payments with status filter, search, and pagination
 */
export declare function getCooperativePayments(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        payments: (import("../../models/payment.model").IPayment & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        cooperative: {
            id: mongoose.Types.ObjectId;
            name: string;
        };
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get summary financial statistics for cooperative payments dashboard
 */
export declare function getCooperativePaymentStats(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        totalGrossRevenue: number;
        totalWorkerPayouts: any;
        totalTransactions: number;
        paidCount: number;
        pendingCount: number;
        pendingAmount: number;
        failedCount: number;
        todayRevenue: any;
        todayCount: any;
        activeWorkersWithPayouts: number;
        societyName: string;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=payment.controller.d.ts.map