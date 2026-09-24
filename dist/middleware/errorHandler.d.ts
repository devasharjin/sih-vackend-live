import type { NextFunction, Request, Response } from "express";
export declare function errorHandler(err: any, req: Request, res: Response, next: NextFunction): Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>>;
//# sourceMappingURL=errorHandler.d.ts.map