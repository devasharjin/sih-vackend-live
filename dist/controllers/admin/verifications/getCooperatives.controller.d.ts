import { Request, Response } from "express";
/**
 * Get all cooperatives for admin verification with status filter, search & pagination
 */
export declare function getAdminCooperatives(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: {
        cooperatives: (import("../../../models/auth/cooperative.model").ICooperative & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
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
//# sourceMappingURL=getCooperatives.controller.d.ts.map