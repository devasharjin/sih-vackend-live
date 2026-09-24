import { Request, Response } from "express";
export declare function refreshToken(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        tokens: import("../../utils/jwt.utils").AuthTokens;
        accessToken: string;
        refreshToken: string;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=refreshToken.controller.d.ts.map