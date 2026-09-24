"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const payment_controller_1 = require("../../controllers/cooperative/payment.controller");
const router = (0, express_1.Router)();
// Protect all cooperative payment endpoints with authentication and COOPERATIVE role
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.COOPERATIVE));
// GET /api/cooperative/payments - List payments for authenticated cooperative society
router.get("/", (0, asyncHandler_1.asyncHandler)(payment_controller_1.getCooperativePayments));
// GET /api/cooperative/payments/stats - Financial metrics & worker earnings aggregation
router.get("/stats", (0, asyncHandler_1.asyncHandler)(payment_controller_1.getCooperativePaymentStats));
exports.default = router;
//# sourceMappingURL=payment.routes.js.map