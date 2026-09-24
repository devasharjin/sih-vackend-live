import { Request, Response } from "express";
import mongoose from "mongoose";
export declare function createService(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: mongoose.Document<unknown, {}, import("../../../models/service.model").IService, {}, mongoose.DefaultSchemaOptions> & import("../../../models/service.model").IService & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=createService.controller.d.ts.map