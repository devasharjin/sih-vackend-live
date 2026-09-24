"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/asyncHandler");
const getServices_controller_1 = require("../../controllers/common/service/getServices.controller");
const getCategories_controller_1 = require("../../controllers/common/category/getCategories.controller");
const router = (0, express_1.Router)();
router.get("/categories", (0, asyncHandler_1.asyncHandler)(getCategories_controller_1.getCategories));
router.get("/categories/:id", (0, asyncHandler_1.asyncHandler)(getCategories_controller_1.getCategory));
router.get("/services", (0, asyncHandler_1.asyncHandler)(getServices_controller_1.getServices));
router.get("/services/:id", (0, asyncHandler_1.asyncHandler)(getServices_controller_1.getServiceById));
exports.default = router;
//# sourceMappingURL=category.routes.js.map