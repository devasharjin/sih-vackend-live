"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
const appError_1 = require("../shared/appError");
function notFound(req, res, next) {
    next(new appError_1.AppError(`Not Found - ${req.originalUrl}`, 404));
}
//# sourceMappingURL=notFound.js.map