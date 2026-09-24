"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const asyncHandler_1 = require("../../shared/asyncHandler");
const profile_controller_1 = require("../../controllers/customer/profile.controller");
const router = (0, express_1.Router)();
// All customer profile routes require authentication
router.use(authMiddleware_1.requireAuth);
// GET /api/customer/profile - Get customer profile, primary address, saved addresses & booking stats
router.get("/", (0, asyncHandler_1.asyncHandler)(profile_controller_1.getCustomerProfile));
// PATCH /api/customer/profile - Update customer personal details (name, phone)
router.patch("/", (0, asyncHandler_1.asyncHandler)(profile_controller_1.updateCustomerProfile));
// PATCH /api/customer/profile/address - Update customer primary address
router.patch("/address", (0, asyncHandler_1.asyncHandler)(profile_controller_1.updatePrimaryAddress));
// POST /api/customer/profile/addresses - Add a new saved address
router.post("/addresses", (0, asyncHandler_1.asyncHandler)(profile_controller_1.addSavedAddress));
// PATCH /api/customer/profile/addresses/:addressId - Update an existing saved address
router.patch("/addresses/:addressId", (0, asyncHandler_1.asyncHandler)(profile_controller_1.updateSavedAddress));
// DELETE /api/customer/profile/addresses/:addressId - Delete a saved address
router.delete("/addresses/:addressId", (0, asyncHandler_1.asyncHandler)(profile_controller_1.deleteSavedAddress));
// PATCH /api/customer/profile/addresses/:addressId/default - Set saved address as default
router.patch("/addresses/:addressId/default", (0, asyncHandler_1.asyncHandler)(profile_controller_1.setDefaultAddress));
exports.default = router;
//# sourceMappingURL=profile.routes.js.map