import { Request, Response } from "express";
import { VoiceProcessResponse } from "../../types/voice.types";
/**
 * POST /api/voice-assistant/process
 * Process multilingual customer voice transcript and return structured booking data
 */
export declare function processVoiceBooking(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: VoiceProcessResponse;
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=voiceAssistant.controller.d.ts.map