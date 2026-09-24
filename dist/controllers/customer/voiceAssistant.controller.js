"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVoiceBooking = processVoiceBooking;
const service_model_1 = __importDefault(require("../../models/service.model"));
const user_model_1 = __importDefault(require("../../models/auth/user.model"));
const llm_service_1 = require("../../services/llm.service");
const envelope_1 = require("../../shared/envelope");
/**
 * POST /api/voice-assistant/process
 * Process multilingual customer voice transcript and return structured booking data
 */
async function processVoiceBooking(req, res) {
    try {
        const { transcript, language, history = [], currentBooking = {}, clientTimezone = "Asia/Kolkata", } = req.body;
        // 1. Validation
        if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
            return (0, envelope_1.fail)(res, "Transcript is required", null, 400);
        }
        if (transcript.length > 1500) {
            return (0, envelope_1.fail)(res, "Transcript exceeds maximum allowed length of 1500 characters", null, 400);
        }
        // 2. Fetch real active service catalog from MongoDB
        const dbServices = await service_model_1.default.find({ isActive: true })
            .populate("category", "name slug")
            .lean();
        if (!dbServices || dbServices.length === 0) {
            return (0, envelope_1.fail)(res, "No active services available in the catalog", null, 503);
        }
        const catalog = dbServices.map((s) => ({
            id: s._id.toString(),
            name: s.name,
            categoryName: s.category?.name || "General",
            description: s.description || "",
            priceType: s.priceType || "hourly",
            firstHourRate: s.firstHourRate ?? s.hourlyPrice ?? 0,
            additionalHourRate: s.additionalHourRate ?? s.firstHourRate ?? s.hourlyPrice ?? 0,
            transportFee: s.transportFee ?? 30,
        }));
        // 3. Optional user context (if authenticated)
        const userId = req.user?.userId || req.user?._id;
        let customerSavedAddresses = [];
        if (userId) {
            try {
                const user = await user_model_1.default.findById(userId).select("address savedAddresses").lean();
                if (user) {
                    if (user.address?.street) {
                        const addr = [user.address.street, user.address.city, user.address.state, user.address.zip]
                            .filter(Boolean)
                            .join(", ");
                        if (addr)
                            customerSavedAddresses.push(addr);
                    }
                    if (user.savedAddresses && user.savedAddresses.length > 0) {
                        for (const sa of user.savedAddresses) {
                            const addr = [sa.street, sa.city, sa.state, sa.zip].filter(Boolean).join(", ");
                            if (addr && !customerSavedAddresses.includes(addr)) {
                                customerSavedAddresses.push(addr);
                            }
                        }
                    }
                }
            }
            catch (err) {
                console.warn("[VoiceAssistantController] Failed to fetch user profile addresses:", err);
            }
        }
        // 4. Send to LLM Service
        const llmResult = await llm_service_1.llmService.processTranscript({
            transcript: transcript.trim(),
            language,
            history,
            currentBooking,
            catalog,
            clientTimezone,
            customerSavedAddresses,
        });
        // 5. Ground and verify matched service strictly against MongoDB
        let matchedServiceData = null;
        if (llmResult.serviceId) {
            const realService = dbServices.find((s) => s._id.toString() === llmResult.serviceId);
            if (realService) {
                const baseFirstHourRate = realService.firstHourRate ?? realService.hourlyPrice ?? 0;
                const baseAdditionalHourRate = realService.additionalHourRate ?? realService.firstHourRate ?? realService.hourlyPrice ?? 0;
                matchedServiceData = {
                    _id: realService._id.toString(),
                    name: realService.name,
                    description: realService.description,
                    category: {
                        _id: realService.category?._id?.toString() || "",
                        name: realService.category?.name || "General",
                        slug: realService.category?.slug || "",
                    },
                    priceType: realService.priceType,
                    firstHourRate: baseFirstHourRate,
                    additionalHourRate: baseAdditionalHourRate,
                    transportFee: realService.transportFee ?? 30,
                    emergencyAvailable: realService.emergencyAvailable ?? true,
                };
            }
            else {
                // Service ID hallucinated or invalid, clear it
                llmResult.serviceId = null;
                llmResult.serviceName = null;
            }
        }
        const responsePayload = {
            ...llmResult,
            matchedService: matchedServiceData,
        };
        return (0, envelope_1.ok)(res, responsePayload, "Voice query processed successfully");
    }
    catch (error) {
        console.error("[VoiceAssistantController] Error processing voice query:", error);
        return (0, envelope_1.fail)(res, error.message || "Failed to process voice booking request", null, 500);
    }
}
//# sourceMappingURL=voiceAssistant.controller.js.map