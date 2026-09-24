import { Request, Response } from "express";
import mongoose from "mongoose";
export declare function getServices(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: (import("../../../models/service.model").IService & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function getServiceById(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: import("../../../models/service.model").IService & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=getServices.controller.d.ts.map