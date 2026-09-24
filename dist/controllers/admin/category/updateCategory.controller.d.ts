import { Request, Response } from "express";
import mongoose from "mongoose";
export declare function updateCategory(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: mongoose.Document<unknown, {}, import("../../../models/category.model").ICategory, {}, mongoose.DefaultSchemaOptions> & import("../../../models/category.model").ICategory & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=updateCategory.controller.d.ts.map