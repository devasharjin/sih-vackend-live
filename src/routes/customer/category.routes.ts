import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler";
import { getServices, getServiceById } from "../../controllers/common/service/getServices.controller";
import { getCategories, getCategory } from "../../controllers/common/category/getCategories.controller";

const router = Router();

router.get("/categories", asyncHandler(getCategories));
router.get("/categories/:id", asyncHandler(getCategory));

router.get("/services", asyncHandler(getServices));
router.get("/services/:id", asyncHandler(getServiceById));

export default router;