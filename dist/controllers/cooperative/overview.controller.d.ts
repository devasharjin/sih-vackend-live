import { Request, Response } from "express";
import mongoose from "mongoose";
import { VerificationStatus } from "../../models/auth/worker.model";
export declare function getCooperativeOverview(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        cooperative: {
            id: mongoose.Types.ObjectId;
            name: string;
            email: string;
            phone: string;
            address: string;
            verificationStatus: VerificationStatus;
            logo: string;
            certificate: string;
            rejectedReason: string | undefined;
        };
        workforce: {
            total: number;
            active: number;
            pending: number;
            approved: number;
            rejected: number;
        };
        financials: {
            grossTurnover: any;
            cooperativeShareEarned: any;
            workerNetDisbursed: any;
            welfareReserveFund: number;
            paidTransactionsCount: any;
        };
        gigs: {
            total: number;
            completed: number;
            inProgress: number;
            pending: number;
            emergency: number;
        };
        pendingActions: {
            pendingWorkersCount: number;
            pendingClaimsCount: number;
            activeEmergencyGigs: number;
        };
        recentBookings: (import("../../models/booking.model").IBooking & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        topTrades: {
            trade: any;
            workerCount: any;
        }[];
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=overview.controller.d.ts.map