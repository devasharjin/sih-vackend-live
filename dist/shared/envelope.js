"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.fail = fail;
function ok(res, data, message = "Success") {
    return res.status(200).json({
        success: true,
        data,
        message,
        status: 200,
    });
}
function fail(res, message = "Internal Server Error", data = null, status = 500) {
    return res.status(status).json({
        success: false,
        data,
        message,
        status,
    });
}
//# sourceMappingURL=envelope.js.map