"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const voiceRateLimiter_1 = require("../../middleware/voiceRateLimiter");
const asyncHandler_1 = require("../../shared/asyncHandler");
const voiceAssistant_controller_1 = require("../../controllers/customer/voiceAssistant.controller");
const router = (0, express_1.Router)();
// POST /api/voice-assistant/process
// Rate-limited, handles optional customer authentication for address auto-population
router.post("/process", authMiddleware_1.optionalAuth, (0, voiceRateLimiter_1.voiceRateLimiter)(40, 60 * 1000), (0, asyncHandler_1.asyncHandler)(voiceAssistant_controller_1.processVoiceBooking));
exports.default = router;
//# sourceMappingURL=voiceAssistant.routes.js.map