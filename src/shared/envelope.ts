import type { Response } from "express";

type Envelope<T> = {
    success: boolean;
    data: T;
    message: string;
    status: number;
};

export function ok<T>(
    res: Response,
    data: T,
    message = "Success"
): Response<Envelope<T>> {
    return res.status(200).json({
        success: true,
        data,
        message,
        status: 200,
    });
}

export function fail<T>(
    res: Response,
    message = "Internal Server Error",
    data: T | null = null,
    status: number = 500
): Response<Envelope<T | null>> {
    return res.status(status).json({
        success: false,
        data,
        message,
        status,
    });
}