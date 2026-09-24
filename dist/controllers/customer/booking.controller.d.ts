import { Request, Response } from "express";
import mongoose from "mongoose";
export declare function createBooking(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function getCustomerBookings(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: (import("../../models/booking.model").IBooking & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function getBookingById(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: import("../../models/booking.model").IBooking & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function cancelBooking(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>>>;
export declare function rateBooking(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: mongoose.Document<unknown, {}, import("../../models/rating.model").IRating, {}, mongoose.DefaultSchemaOptions> & import("../../models/rating.model").IRating & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=booking.controller.d.ts.map