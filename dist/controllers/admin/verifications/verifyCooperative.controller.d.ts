import { Request, Response } from "express";
/**
 * Approve, reject, or reset a cooperative registration
 */
export declare function verifyAdminCooperative(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=verifyCooperative.controller.d.ts.map