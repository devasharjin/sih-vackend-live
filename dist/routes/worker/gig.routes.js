"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const gig_controller_1 = require("../../controllers/worker/gig.controller");
const router = (0, express_1.Router)();
// Protect all worker gig & jobs routes with authentication & WORKER role check
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.WORKER));
// GET /api/worker/gigs/available - List all available gig requests matching skills
router.get("/available", (0, asyncHandler_1.asyncHandler)(gig_controller_1.getAvailableGigs));
// GET /api/worker/gigs/my-jobs - List worker's assigned, active, and completed jobs
router.get("/my-jobs", (0, asyncHandler_1.asyncHandler)(gig_controller_1.getMyJobs));
// GET /api/worker/gigs/jobs/:id - Get specific job details
router.get("/jobs/:id", (0, asyncHandler_1.asyncHandler)(gig_controller_1.getWorkerJobById));
// GET /api/worker/gigs/stats - Get worker gig metrics, ratings & job summary
router.get("/stats", (0, asyncHandler_1.asyncHandler)(gig_controller_1.getWorkerStats));
// PATCH /api/worker/gigs/profile - Update worker availability, experience, location and profile
router.patch("/profile", (0, asyncHandler_1.asyncHandler)(gig_controller_1.updateWorkerProfile));
// PATCH /api/worker/gigs/:id/accept - Worker accepts a pending gig request
router.patch("/:id/accept", (0, asyncHandler_1.asyncHandler)(gig_controller_1.acceptGig));
// PATCH /api/worker/gigs/:id/status - Update job status (IN_PROGRESS, COMPLETED, CANCELLED)
router.patch("/:id/status", (0, asyncHandler_1.asyncHandler)(gig_controller_1.updateJobStatus));
exports.default = router;
//# sourceMappingURL=gig.routes.js.map