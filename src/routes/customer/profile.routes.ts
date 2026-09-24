import { Router } from "express";
import { requireAuth } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getCustomerProfile,
  updateCustomerProfile,
  updatePrimaryAddress,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
  setDefaultAddress,
} from "../../controllers/customer/profile.controller";

const router = Router();

// All customer profile routes require authentication
router.use(requireAuth);

// GET /api/customer/profile - Get customer profile, primary address, saved addresses & booking stats
router.get("/", asyncHandler(getCustomerProfile));

// PATCH /api/customer/profile - Update customer personal details (name, phone)
router.patch("/", asyncHandler(updateCustomerProfile));

// PATCH /api/customer/profile/address - Update customer primary address
router.patch("/address", asyncHandler(updatePrimaryAddress));

// POST /api/customer/profile/addresses - Add a new saved address
router.post("/addresses", asyncHandler(addSavedAddress));

// PATCH /api/customer/profile/addresses/:addressId - Update an existing saved address
router.patch("/addresses/:addressId", asyncHandler(updateSavedAddress));

// DELETE /api/customer/profile/addresses/:addressId - Delete a saved address
router.delete("/addresses/:addressId", asyncHandler(deleteSavedAddress));

// PATCH /api/customer/profile/addresses/:addressId/default - Set saved address as default
router.patch("/addresses/:addressId/default", asyncHandler(setDefaultAddress));

export default router;
