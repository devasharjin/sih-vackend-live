"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/asyncHandler");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const createService_controller_1 = require("../../controllers/admin/services/createService.controller");
const getServices_controller_1 = require("../../controllers/common/service/getServices.controller");
const updateService_controller_1 = require("../../controllers/admin/services/updateService.controller");
const deleteService_controller_1 = require("../../controllers/admin/services/deleteService.controller");
const router = (0, express_1.Router)();
// Protect all admin service routes
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.SUPERADMIN));
router.post("/", (0, asyncHandler_1.asyncHandler)(createService_controller_1.createService));
router.get("/", (0, asyncHandler_1.asyncHandler)(getServices_controller_1.getServices));
router.get("/:id", (0, asyncHandler_1.asyncHandler)(getServices_controller_1.getServiceById));
router.put("/:id", (0, asyncHandler_1.asyncHandler)(updateService_controller_1.updateService));
router.delete("/:id", (0, asyncHandler_1.asyncHandler)(deleteService_controller_1.deleteService));
exports.default = router;
//# sourceMappingURL=service.routes.js.map