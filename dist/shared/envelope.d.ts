import type { Response } from "express";
type Envelope<T> = {
    success: boolean;
    data: T;
    message: string;
    status: number;
};
export declare function ok<T>(res: Response, data: T, message?: string): Response<Envelope<T>>;
export declare function fail<T>(res: Response, message?: string, data?: T | null, status?: number): Response<Envelope<T | null>>;
export {};
//# sourceMappingURL=envelope.d.ts.map