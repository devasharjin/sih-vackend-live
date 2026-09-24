import { Request, Response } from "express";
import mongoose from "mongoose";
import { UserRole, AccountStatus } from "../../models/auth/user.model";
/**
 * Get paginated, searchable list of users with role and status filters
 */
export declare function getAdminUsers(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        users: (import("../../models/auth/user.model").IUser & Required<{
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
 * Get aggregated user count metrics by role and account status
 */
export declare function getAdminUserStats(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        totalUsers: number;
        activeUsers: number;
        suspendedUsers: number;
        byRole: {
            customers: number;
            workers: number;
            cooperatives: number;
            superadmins: number;
        };
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get single user profile with linked worker/cooperative entity and booking history
 */
export declare function getAdminUserById(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        user: import("../../models/auth/user.model").IUser & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        };
        workerProfile: (import("../../models/auth/worker.model").IWorker & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        }) | null;
        cooperativeProfile: (import("../../models/auth/cooperative.model").ICooperative & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        }) | null;
        activity: {
            customerBookingsCount: number;
        };
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Update user account status (ACTIVE, SUSPEND, INACTIVE) with audit reason
 */
export declare function updateAdminUserStatus(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        id: mongoose.Types.ObjectId;
        name: string;
        email: string;
        accountStatus: AccountStatus;
        reason: any;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Update assigned roles for a user
 */
export declare function updateAdminUserRoles(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        id: mongoose.Types.ObjectId;
        name: string;
        email: string;
        role: UserRole[];
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=user.controller.d.ts.map