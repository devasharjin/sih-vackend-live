import { Request, Response } from "express";
import { UserRole } from "../../../models/auth/user.model";
export declare function userRegister(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        user: {
            _id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            phone: string;
            role: UserRole[];
            accountStatus: import("../../../models/auth/user.model").AccountStatus;
            profilePicture: string | undefined;
        };
        tokens: import("../../../utils/jwt.utils").AuthTokens;
        accessToken: string;
        refreshToken: string;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=userRegister.controller.d.ts.map