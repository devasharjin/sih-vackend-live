import { Request, Response } from "express";
import mongoose from "mongoose";
/**
 * Get single cooperative details for admin review
 */
export declare function getAdminCooperativeById(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: import("../../../models/auth/cooperative.model").ICooperative & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=getCooperativeById.controller.d.ts.map