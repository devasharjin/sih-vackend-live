"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const envelope_1 = require("../shared/envelope");
const appError_1 = require("../shared/appError");
function errorHandler(err, req, res, next) {
    if (err instanceof appError_1.AppError) {
        return (0, envelope_1.fail)(res, err.message, null, err.statusCode);
    }
    console.error("Unhandled Error:", err);
    // MongoDB duplicate key error
    if (err?.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "field";
        return (0, envelope_1.fail)(res, `A record with this ${field} already exists`, null, 409);
    }
    // Mongoose validation error
    if (err?.name === "ValidationError") {
        const message = Object.values(err.errors || {})
            .map((e) => e.message)
            .join(", ");
        return (0, envelope_1.fail)(res, message || "Validation failed", null, 400);
    }
    // Mongoose invalid ObjectId cast error
    if (err?.name === "CastError") {
        return (0, envelope_1.fail)(res, `Invalid format for field: ${err.path}`, null, 400);
    }
    return (0, envelope_1.fail)(res, err?.message || "Internal Server Error", null, 500);
}
//# sourceMappingURL=errorHandler.js.map