export interface VoiceBookingDetails {
    serviceId: string | null;
    serviceName: string | null;
    category: string | null;
    bookingDate: string | null;
    bookingTime: string | null;
    customerAddress: string | null;
    bookingType: "SCHEDULED" | "PREMIUM" | "ON_DEMAND" | "EMERGENCY";
    additionalInstructions: string;
}
export interface ConversationTurn {
    role: "user" | "assistant";
    content: string;
}
export interface VoiceProcessRequest {
    transcript: string;
    language?: string;
    history?: ConversationTurn[];
    currentBooking?: Partial<VoiceBookingDetails>;
    clientTimezone?: string;
    userLocation?: {
        latitude: number;
        longitude: number;
    };
}
export interface MatchedServiceSummary {
    _id: string;
    name: string;
    description: string;
    category: {
        _id: string;
        name: string;
        slug?: string;
    };
    priceType: "hourly" | "meters";
    firstHourRate: number;
    additionalHourRate: number;
    transportFee: number;
    emergencyAvailable?: boolean;
}
export interface CandidateServiceSummary {
    _id: string;
    name: string;
    categoryName: string;
    firstHourRate: number;
    description?: string;
}
export interface VoiceProcessResponse {
    intent: "BOOK_SERVICE" | "INQUIRE_SERVICE" | "CANCEL_VOICE" | "UNKNOWN";
    detectedLanguage: string;
    confidence: number;
    matchedService: MatchedServiceSummary | null;
    candidateServices?: CandidateServiceSummary[];
    serviceName: string | null;
    serviceId: string | null;
    category: string | null;
    bookingDate: string | null;
    bookingTime: string | null;
    customerAddress: string | null;
    bookingType: "SCHEDULED" | "PREMIUM" | "ON_DEMAND" | "EMERGENCY";
    additionalInstructions: string;
    missingFields: Array<"service" | "date" | "time" | "address">;
    responseMessage: string;
    isReadyToBook: boolean;
}
//# sourceMappingURL=voice.types.d.ts.map