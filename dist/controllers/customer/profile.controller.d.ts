import { Request, Response } from "express";
import mongoose from "mongoose";
import { IAddress, ISavedAddress } from "../../models/auth/user.model";
/**
 * GET /api/customer/profile
 * Retrieves user profile details, addresses, and customer booking activity metrics
 */
export declare function getCustomerProfile(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        user: import("../../models/auth/user.model").IUser & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        };
        address: IAddress;
        savedAddresses: ISavedAddress[];
        stats: {
            totalBookings: number;
            activeBookings: number;
            completedBookings: number;
            cancelledBookings: number;
            totalSavedAddresses: number;
        };
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * PATCH /api/customer/profile
 * Updates basic customer personal details (name, phone, profilePicture)
 */
export declare function updateCustomerProfile(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        user: (import("../../models/auth/user.model").IUser & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        }) | null;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * PATCH /api/customer/profile/address
 * Updates customer's primary address
 */
export declare function updatePrimaryAddress(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        address: IAddress;
        savedAddresses: ISavedAddress[];
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * POST /api/customer/profile/addresses
 * Adds a new address to customer's savedAddresses
 */
export declare function addSavedAddress(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        address: IAddress;
        savedAddresses: ISavedAddress[];
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * PATCH /api/customer/profile/addresses/:addressId
 * Updates an existing address in customer's savedAddresses
 */
export declare function updateSavedAddress(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        address: IAddress;
        savedAddresses: ISavedAddress[];
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * DELETE /api/customer/profile/addresses/:addressId
 * Deletes a saved address by its ID
 */
export declare function deleteSavedAddress(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        address: IAddress;
        savedAddresses: ISavedAddress[];
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * PATCH /api/customer/profile/addresses/:addressId/default
 * Sets a specific address as default and syncs it with primary address
 */
export declare function setDefaultAddress(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        address: IAddress;
        savedAddresses: ISavedAddress[];
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=profile.controller.d.ts.map