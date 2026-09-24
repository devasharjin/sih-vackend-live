import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { createService } from "../../controllers/admin/services/createService.controller";
import { getServices, getServiceById } from "../../controllers/common/service/getServices.controller";
import { updateService } from "../../controllers/admin/services/updateService.controller";
import { deleteService } from "../../controllers/admin/services/deleteService.controller";

const router = Router();

// Protect all admin service routes
router.use(requireAuth, requireRole(UserRole.SUPERADMIN));

router.post("/", asyncHandler(createService));
router.get("/", asyncHandler(getServices));
router.get("/:id", asyncHandler(getServiceById));
router.put("/:id", asyncHandler(updateService));
router.delete("/:id", asyncHandler(deleteService));

export default router;

