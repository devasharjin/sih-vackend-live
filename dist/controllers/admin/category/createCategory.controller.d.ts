import { Request, Response } from "express";
export declare function createCategory(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: import("mongoose").Document<unknown, {}, import("../../../models/category.model").ICategory, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/category.model").ICategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=createCategory.controller.d.ts.map