import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { createCategory } from "../../controllers/admin/category/createCategory.controller";
import { getCategories, getCategory } from "../../controllers/common/category/getCategories.controller";
import { updateCategory } from "../../controllers/admin/category/updateCategory.controller";
import { deleteCategory } from "../../controllers/admin/category/deleteCategory.controller";

const router = Router();

// Protect all admin category routes
router.use(requireAuth, requireRole(UserRole.SUPERADMIN));

router.post("/", asyncHandler(createCategory));
router.get("/", asyncHandler(getCategories));
router.get("/:id", asyncHandler(getCategory));
router.put("/:id", asyncHandler(updateCategory));
router.delete("/:id", asyncHandler(deleteCategory));

export default router;
