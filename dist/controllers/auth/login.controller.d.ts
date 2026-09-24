import { Request, Response } from "express";
import { AccountStatus } from "../../models/auth/user.model";
export declare function login(req: Request, res: Response): Promise<Response<{
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
            role: import("../../models/auth/user.model").UserRole[];
            accountStatus: AccountStatus.ACTIVE | AccountStatus.INACTIVE;
            profilePicture: string | undefined;
        };
        tokens: import("../../utils/jwt.utils").AuthTokens;
        accessToken: string;
        refreshToken: string;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=login.controller.d.ts.map