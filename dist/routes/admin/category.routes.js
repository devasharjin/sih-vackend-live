"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/asyncHandler");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const createCategory_controller_1 = require("../../controllers/admin/category/createCategory.controller");
const getCategories_controller_1 = require("../../controllers/common/category/getCategories.controller");
const updateCategory_controller_1 = require("../../controllers/admin/category/updateCategory.controller");
const deleteCategory_controller_1 = require("../../controllers/admin/category/deleteCategory.controller");
const router = (0, express_1.Router)();
// Protect all admin category routes
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.SUPERADMIN));
router.post("/", (0, asyncHandler_1.asyncHandler)(createCategory_controller_1.createCategory));
router.get("/", (0, asyncHandler_1.asyncHandler)(getCategories_controller_1.getCategories));
router.get("/:id", (0, asyncHandler_1.asyncHandler)(getCategories_controller_1.getCategory));
router.put("/:id", (0, asyncHandler_1.asyncHandler)(updateCategory_controller_1.updateCategory));
router.delete("/:id", (0, asyncHandler_1.asyncHandler)(deleteCategory_controller_1.deleteCategory));
exports.default = router;
//# sourceMappingURL=category.routes.js.map