import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getAvailableGigs,
  getMyJobs,
  getWorkerJobById,
  acceptGig,
  updateJobStatus,
  getWorkerStats,
  updateWorkerProfile,
} from "../../controllers/worker/gig.controller";

const router = Router();

// Protect all worker gig & jobs routes with authentication & WORKER role check
router.use(requireAuth, requireRole(UserRole.WORKER));

// GET /api/worker/gigs/available - List all available gig requests matching skills
router.get("/available", asyncHandler(getAvailableGigs));

// GET /api/worker/gigs/my-jobs - List worker's assigned, active, and completed jobs
router.get("/my-jobs", asyncHandler(getMyJobs));

// GET /api/worker/gigs/jobs/:id - Get specific job details
router.get("/jobs/:id", asyncHandler(getWorkerJobById));

// GET /api/worker/gigs/stats - Get worker gig metrics, ratings & job summary
router.get("/stats", asyncHandler(getWorkerStats));

// PATCH /api/worker/gigs/profile - Update worker availability, experience, location and profile
router.patch("/profile", asyncHandler(updateWorkerProfile));

// PATCH /api/worker/gigs/:id/accept - Worker accepts a pending gig request
router.patch("/:id/accept", asyncHandler(acceptGig));

// PATCH /api/worker/gigs/:id/status - Update job status (IN_PROGRESS, COMPLETED, CANCELLED)
router.patch("/:id/status", asyncHandler(updateJobStatus));

export default router;
