import type { Request, Response, NextFunction } from "express";
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=asyncHandler.d.ts.map