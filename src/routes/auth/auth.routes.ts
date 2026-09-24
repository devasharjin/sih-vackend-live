import { Router } from "express";
import { requireAuth } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../shared/asyncHandler";
import { workerRegister } from "../../controllers/auth/register/workerRegister";
import { cooperativeRegister } from "../../controllers/auth/register/cooperativeRegister";
import { login } from "../../controllers/auth/login.controller";
import { refreshToken } from "../../controllers/auth/refreshToken.controller";
import { logout } from "../../controllers/auth/logout.controller";
import { getProfile } from "../../controllers/auth/getProfile.controller";
import { getCooperatives } from "../../controllers/auth/getCooperatives.controller";
import { userRegister } from "../../controllers/auth/register/userRegister.controller";
import {
  workerDocumentsUpload,
  cooperativeDocumentsUpload,
} from "../../middleware/multer.middleware";


const router = Router();

router.post("/register/customer", asyncHandler(userRegister));
router.post(
  "/register/worker",
  requireAuth,
  workerDocumentsUpload,
  asyncHandler(workerRegister)
);
router.post(
  "/register/cooperative",
  requireAuth,
  cooperativeDocumentsUpload,
  asyncHandler(cooperativeRegister)
);
router.post("/login", asyncHandler(login));
router.post("/refresh-token", asyncHandler(refreshToken));
router.post("/logout", asyncHandler(logout));
router.get("/me", requireAuth, asyncHandler(getProfile));
router.get("/cooperatives", asyncHandler(getCooperatives));

export default router;
