import { VoiceBookingDetails, ConversationTurn, VoiceProcessResponse } from "../types/voice.types";
interface CatalogServiceItem {
    id: string;
    name: string;
    categoryName: string;
    description: string;
    priceType: string;
    firstHourRate: number;
    additionalHourRate: number;
    transportFee: number;
}
export interface LLMProcessInput {
    transcript: string;
    language?: string;
    history?: ConversationTurn[];
    currentBooking?: Partial<VoiceBookingDetails>;
    catalog: CatalogServiceItem[];
    clientTimezone?: string;
    customerSavedAddresses?: string[];
}
export declare class LLMService {
    /**
     * Process a voice transcript with LLM or robust multilingual fallback
     */
    processTranscript(input: LLMProcessInput): Promise<VoiceProcessResponse>;
    /**
     * Google Gemini Provider
     */
    private callGemini;
    /**
     * OpenAI Compatible Provider
     */
    private callOpenAI;
    /**
     * High-accuracy Local Multilingual Intent & Entity Extractor (Guaranteed fallback)
     */
    localMultilingualExtractor(input: LLMProcessInput): VoiceProcessResponse;
    /**
     * Helper: Match spoken text against catalog with multilingual keyword synonyms
     */
    private matchServiceFromCatalog;
    /**
     * Helper: Resolve relative and explicit dates in timezone
     */
    private extractDate;
    /**
     * Helper: Extract and normalize time to HH:mm (24-hour)
     */
    private extractTime;
    /**
     * Helper: Extract address from text
     */
    private extractAddress;
    /**
     * Detect Language
     */
    private detectLanguage;
    /**
     * Multilingual response generator
     */
    private generateMultilingualResponse;
    /**
     * Helper: Format and validate LLM output strictly
     */
    private formatAndValidateResponse;
}
export declare const llmService: LLMService;
export {};
//# sourceMappingURL=llm.service.d.ts.map