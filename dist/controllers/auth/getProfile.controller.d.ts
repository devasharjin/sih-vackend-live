import { Request, Response } from "express";
export declare function getProfile(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        user: import("mongoose").Document<unknown, {}, import("../../models/auth/user.model").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../../models/auth/user.model").IUser & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        worker: any;
        cooperative: any;
        profile: any;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=getProfile.controller.d.ts.map