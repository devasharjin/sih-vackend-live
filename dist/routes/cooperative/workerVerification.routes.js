"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const workerVerification_controller_1 = require("../../controllers/cooperative/verifications/workerVerification.controller");
const router = (0, express_1.Router)();
// Protect all routes with authentication and COOPERATIVE role check
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.COOPERATIVE));
// GET /api/cooperative/workers - list workers with status filter & counts
router.get("/workers", (0, asyncHandler_1.asyncHandler)(workerVerification_controller_1.getCooperativeWorkers));
// GET /api/cooperative/workers/:id - single worker verification details
router.get("/workers/:id", (0, asyncHandler_1.asyncHandler)(workerVerification_controller_1.getCooperativeWorkerById));
// PATCH /api/cooperative/workers/:id/verify - approve or reject worker
router.patch("/workers/:id/verify", (0, asyncHandler_1.asyncHandler)(workerVerification_controller_1.verifyWorker));
exports.default = router;
//# sourceMappingURL=workerVerification.routes.js.map