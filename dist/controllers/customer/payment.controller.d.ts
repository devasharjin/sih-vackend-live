import { Request, Response } from "express";
export declare function createPaymentOrder(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: import("../../services/payment.service").CreateOrderResult;
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function verifyPayment(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        booking: any;
        payment: import("../../models/payment.model").IPayment;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function getPaymentDetails(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function getRazorpayConfig(_req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: {
        keyId: string;
        isConfigured: boolean;
        currency: string;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=payment.controller.d.ts.map