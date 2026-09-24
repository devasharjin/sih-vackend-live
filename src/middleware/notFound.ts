import type { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/appError";

export function notFound(req: Request, res: Response, next: NextFunction) {
    next(new AppError(`Not Found - ${req.originalUrl}`, 404))
}