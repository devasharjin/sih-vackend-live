import { Request, Response } from "express";
import mongoose from "mongoose";
/**
 * Get all platform payments with filtering, search, and pagination
 */
export declare function getAdminPayments(req: Request, res: Response): Promise<Response<{
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
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get summary statistics for admin payments dashboard
 */
export declare function getAdminPaymentStats(_req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: {
        totalRevenue: number;
        totalTransactions: number;
        paidCount: number;
        pendingCount: number;
        pendingAmount: number;
        failedCount: number;
        todayRevenue: any;
        todayCount: any;
        activeCooperativesCount: number;
        avgOrderValue: number;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=payment.controller.d.ts.map