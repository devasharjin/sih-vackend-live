import { Request, Response } from "express";
import mongoose from "mongoose";
export declare function getCategories(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: (import("../../../models/category.model").ICategory & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function getCategory(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: import("../../../models/category.model").ICategory & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=getCategories.controller.d.ts.map