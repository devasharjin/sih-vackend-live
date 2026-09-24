import { Router } from "express";
import { optionalAuth } from "../../middleware/authMiddleware";
import { voiceRateLimiter } from "../../middleware/voiceRateLimiter";
import { asyncHandler } from "../../shared/asyncHandler";
import { processVoiceBooking } from "../../controllers/customer/voiceAssistant.controller";

const router = Router();

// POST /api/voice-assistant/process
// Rate-limited, handles optional customer authentication for address auto-population
router.post("/process", optionalAuth, voiceRateLimiter(40, 60 * 1000), asyncHandler(processVoiceBooking));

export default router;
