import { Request, Response } from "express";
import Service from "../../models/service.model";
import User from "../../models/auth/user.model";
import { llmService } from "../../services/llm.service";
import { fail, ok } from "../../shared/envelope";
import { VoiceProcessRequest, VoiceProcessResponse } from "../../types/voice.types";

/**
 * POST /api/voice-assistant/process
 * Process multilingual customer voice transcript and return structured booking data
 */
export async function processVoiceBooking(req: Request, res: Response) {
  try {
    const {
      transcript,
      language,
      history = [],
      currentBooking = {},
      clientTimezone = "Asia/Kolkata",
    } = req.body as VoiceProcessRequest;

    // 1. Validation
    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return fail(res, "Transcript is required", null, 400);
    }

    if (transcript.length > 1500) {
      return fail(res, "Transcript exceeds maximum allowed length of 1500 characters", null, 400);
    }

    // 2. Fetch real active service catalog from MongoDB
    const dbServices = await Service.find({ isActive: true })
      .populate("category", "name slug")
      .lean();

    if (!dbServices || dbServices.length === 0) {
      return fail(res, "No active services available in the catalog", null, 503);
    }

    const catalog = dbServices.map((s: any) => ({
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
    const userId = (req.user as any)?.userId || (req.user as any)?._id;
    let customerSavedAddresses: string[] = [];

    if (userId) {
      try {
        const user = await User.findById(userId).select("address savedAddresses").lean();
        if (user) {
          if (user.address?.street) {
            const addr = [user.address.street, user.address.city, user.address.state, user.address.zip]
              .filter(Boolean)
              .join(", ");
            if (addr) customerSavedAddresses.push(addr);
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
      } catch (err) {
        console.warn("[VoiceAssistantController] Failed to fetch user profile addresses:", err);
      }
    }

    // 4. Send to LLM Service
    const llmResult = await llmService.processTranscript({
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
      const realService = dbServices.find(
        (s: any) => s._id.toString() === llmResult.serviceId
      );

      if (realService) {
        const baseFirstHourRate = realService.firstHourRate ?? (realService as any).hourlyPrice ?? 0;
        const baseAdditionalHourRate =
          realService.additionalHourRate ?? realService.firstHourRate ?? (realService as any).hourlyPrice ?? 0;

        matchedServiceData = {
          _id: realService._id.toString(),
          name: realService.name,
          description: realService.description,
          category: {
            _id: (realService.category as any)?._id?.toString() || "",
            name: (realService.category as any)?.name || "General",
            slug: (realService.category as any)?.slug || "",
          },
          priceType: realService.priceType,
          firstHourRate: baseFirstHourRate,
          additionalHourRate: baseAdditionalHourRate,
          transportFee: realService.transportFee ?? 30,
          emergencyAvailable: realService.emergencyAvailable ?? true,
        };
      } else {
        // Service ID hallucinated or invalid, clear it
        llmResult.serviceId = null;
        llmResult.serviceName = null;
      }
    }

    const responsePayload: VoiceProcessResponse = {
      ...llmResult,
      matchedService: matchedServiceData,
    };

    return ok(res, responsePayload, "Voice query processed successfully");
  } catch (error: any) {
    console.error("[VoiceAssistantController] Error processing voice query:", error);
    return fail(res, error.message || "Failed to process voice booking request", null, 500);
  }
}
