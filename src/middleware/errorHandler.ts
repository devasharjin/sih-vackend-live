
import type { NextFunction, Request, Response } from "express";
import { fail } from "../shared/envelope";
import { AppError } from "../shared/appError";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    if (err instanceof AppError) {
        return fail(res, err.message, null, err.statusCode);
    }

    console.error("Unhandled Error:", err);

    // MongoDB duplicate key error
    if (err?.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "field";
        return fail(res, `A record with this ${field} already exists`, null, 409);
    }

    // Mongoose validation error
    if (err?.name === "ValidationError") {
        const message = Object.values(err.errors || {})
            .map((e: any) => e.message)
            .join(", ");
        return fail(res, message || "Validation failed", null, 400);
    }

    // Mongoose invalid ObjectId cast error
    if (err?.name === "CastError") {
        return fail(res, `Invalid format for field: ${err.path}`, null, 400);
    }

    return fail(res, err?.message || "Internal Server Error", null, 500);
}   