import { Request, Response } from "express";
export declare function submitContactMessage(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        ticketNumber: string;
        createdAt: Date;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=contact.controller.d.ts.map