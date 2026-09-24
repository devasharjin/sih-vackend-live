import { NextFunction, Request, Response } from "express";
import { UserRole } from "../models/auth/user.model";
type Role = UserRole | string;
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | undefined;
export declare function requireRole(...allowedRoles: Role[]): (req: Request, res: Response, next: NextFunction) => Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | undefined;
export declare function optionalAuth(req: Request, _res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=authMiddleware.d.ts.map