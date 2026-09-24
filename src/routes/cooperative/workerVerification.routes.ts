import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getCooperativeWorkers,
  getCooperativeWorkerById,
  verifyWorker,
} from "../../controllers/cooperative/verifications/workerVerification.controller";

const router = Router();

// Protect all routes with authentication and COOPERATIVE role check
router.use(requireAuth, requireRole(UserRole.COOPERATIVE));

// GET /api/cooperative/workers - list workers with status filter & counts
router.get("/workers", asyncHandler(getCooperativeWorkers));

// GET /api/cooperative/workers/:id - single worker verification details
router.get("/workers/:id", asyncHandler(getCooperativeWorkerById));

// PATCH /api/cooperative/workers/:id/verify - approve or reject worker
router.patch("/workers/:id/verify", asyncHandler(verifyWorker));

export default router;
