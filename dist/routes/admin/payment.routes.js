"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const payment_controller_1 = require("../../controllers/admin/payment.controller");
const router = (0, express_1.Router)();
// Protect all admin payment endpoints with authentication and SUPERADMIN role
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.SUPERADMIN));
// GET /api/admin/payments - List all payments with filter, search & pagination
router.get("/", (0, asyncHandler_1.asyncHandler)(payment_controller_1.getAdminPayments));
// GET /api/admin/payments/stats - Get platform-wide payment statistics
router.get("/stats", (0, asyncHandler_1.asyncHandler)(payment_controller_1.getAdminPaymentStats));
exports.default = router;
//# sourceMappingURL=payment.routes.js.map