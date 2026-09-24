"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = logout;
const envelope_1 = require("../../shared/envelope");
const cookie_utils_1 = require("../../utils/cookie.utils");
async function logout(_req, res) {
    // Clear authentication cookies with matching options
    (0, cookie_utils_1.clearAuthCookies)(res);
    return (0, envelope_1.ok)(res, null, "Logged out successfully");
}
//# sourceMappingURL=logout.controller.js.map