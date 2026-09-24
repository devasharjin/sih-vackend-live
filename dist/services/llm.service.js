"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmService = exports.LLMService = void 0;
class LLMService {
    /**
     * Process a voice transcript with LLM or robust multilingual fallback
     */
    async processTranscript(input) {
        const geminiKey = process.env.GEMINI_API_KEY;
        const openAiKey = process.env.OPENAI_API_KEY;
        // Try Google Gemini first if key exists
        if (geminiKey && geminiKey.trim()) {
            try {
                const result = await this.callGemini(input, geminiKey.trim());
                if (result)
                    return result;
            }
            catch (error) {
                console.warn("[LLMService] Gemini API call failed, falling back to local extractor:", error);
            }
        }
        // Try OpenAI if configured
        if (openAiKey && openAiKey.trim()) {
            try {
                const result = await this.callOpenAI(input, openAiKey.trim());
                if (result)
                    return result;
            }
            catch (error) {
                console.warn("[LLMService] OpenAI API call failed, falling back to local extractor:", error);
            }
        }
        // High-accuracy multilingual local rule-based extractor
        return this.localMultilingualExtractor(input);
    }
    /**
     * Google Gemini Provider
     */
    async callGemini(input, apiKey) {
        const model = process.env.VOICE_ASSISTANT_MODEL || "gemini-1.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const now = new Date();
        const tz = input.clientTimezone || "Asia/Kolkata";
        const dateStr = now.toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD
        const timeStr = now.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
        const systemPrompt = `You are a multilingual AI booking assistant for "Cooperative Gig Services", a platform connecting customers to verified gig workers.
Today's local date is ${dateStr} (YYYY-MM-DD) and current time is ${timeStr} in timezone ${tz}.
Resolve relative dates (e.g., "tomorrow", "நாளை", "कल", "రేపు") starting strictly from today (${dateStr}).

Available Real Service Catalog:
${JSON.stringify(input.catalog, null, 2)}

Current Accumulated Booking State:
${JSON.stringify(input.currentBooking || {}, null, 2)}

Customer Saved Addresses:
${JSON.stringify(input.customerSavedAddresses || [], null, 2)}

RULES:
1. Extract or update: serviceId (must EXACTLY match an 'id' from the catalog or be null), serviceName, bookingDate (YYYY-MM-DD), bookingTime (HH:mm 24hr), customerAddress, bookingType (SCHEDULED, ON_DEMAND, or EMERGENCY), additionalInstructions.
2. If service is ambiguous or multiple match, list their candidate service names in candidates.
3. If the user mentions a non-existent or unsupported service, set serviceId to null, intent to UNKNOWN or INQUIRE_SERVICE, and politely inform them.
4. If details like time or address are missing, list them in missingFields and ask for them in responseMessage in the customer's language.
5. NEVER invent prices, worker names, or fake service IDs.
6. Return purely a valid JSON object strictly matching this JSON schema.`;
        const contents = [];
        if (input.history && input.history.length > 0) {
            for (const turn of input.history) {
                contents.push({
                    role: turn.role === "assistant" ? "model" : "user",
                    parts: [{ text: turn.content }],
                });
            }
        }
        contents.push({
            role: "user",
            parts: [{ text: input.transcript }],
        });
        const body = {
            systemInstruction: {
                parts: [{ text: systemPrompt }],
            },
            contents,
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1,
            },
        };
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error(`Gemini API returned status ${res.status}: ${await res.text()}`);
        }
        const data = (await res.json());
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText)
            return null;
        const parsed = JSON.parse(candidateText);
        return this.formatAndValidateResponse(parsed, input);
    }
    /**
     * OpenAI Compatible Provider
     */
    async callOpenAI(input, apiKey) {
        const url = process.env.OPENAI_API_BASE || "https://api.openai.com/v1/chat/completions";
        const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
        const now = new Date();
        const tz = input.clientTimezone || "Asia/Kolkata";
        const dateStr = now.toLocaleDateString("en-CA", { timeZone: tz });
        const messages = [
            {
                role: "system",
                content: `You are a multilingual AI booking assistant for Cooperative Gig Services. Today is ${dateStr} in ${tz}. Catalog: ${JSON.stringify(input.catalog)}. State: ${JSON.stringify(input.currentBooking || {})}. Output pure JSON.`,
            },
            ...(input.history || []).map((h) => ({ role: h.role, content: h.content })),
            { role: "user", content: input.transcript },
        ];
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                response_format: { type: "json_object" },
                temperature: 0.1,
            }),
        });
        if (!res.ok) {
            throw new Error(`OpenAI API returned status ${res.status}: ${await res.text()}`);
        }
        const data = (await res.json());
        const content = data.choices?.[0]?.message?.content;
        if (!content)
            return null;
        const parsed = JSON.parse(content);
        return this.formatAndValidateResponse(parsed, input);
    }
    /**
     * High-accuracy Local Multilingual Intent & Entity Extractor (Guaranteed fallback)
     */
    localMultilingualExtractor(input) {
        const text = input.transcript.trim();
        const lower = text.toLowerCase();
        const lang = input.language || this.detectLanguage(text);
        // Accumulated state
        let serviceId = input.currentBooking?.serviceId || null;
        let serviceName = input.currentBooking?.serviceName || null;
        let category = input.currentBooking?.category || null;
        let bookingDate = input.currentBooking?.bookingDate || null;
        let bookingTime = input.currentBooking?.bookingTime || null;
        let customerAddress = input.currentBooking?.customerAddress || null;
        let bookingType = input.currentBooking?.bookingType || "SCHEDULED";
        let additionalInstructions = input.currentBooking?.additionalInstructions || "";
        // 1. Detect Booking Classification / Emergency
        const emergencyWords = [
            "emergency", "urgent", "sos", "danger", "burst", "bursting", "immediate", "right now",
            "அவசரம்", "உடனடியாக", "உடனே", "வெடித்துவிட்டது",
            "आपातकालीन", "तुरंत", "फटाफट", "जल्दी",
            "అత్యవసరం", "వెంటనే", "త్వరగా",
        ];
        if (emergencyWords.some((w) => lower.includes(w) || text.includes(w))) {
            bookingType = "EMERGENCY";
        }
        else if (lower.includes("premium") ||
            lower.includes("top rated") ||
            lower.includes("specialist") ||
            lower.includes("on demand") ||
            lower.includes("asap") ||
            lower.includes("today itself")) {
            bookingType = "PREMIUM";
        }
        // 2. Resolve Service Matching against real Catalog
        const matched = this.matchServiceFromCatalog(text, input.catalog);
        let candidateServices = [];
        if (matched.exactMatch) {
            serviceId = matched.exactMatch.id;
            serviceName = matched.exactMatch.name;
            category = matched.exactMatch.categoryName;
        }
        else if (matched.candidates.length > 0) {
            if (matched.candidates.length === 1) {
                serviceId = matched.candidates[0].id;
                serviceName = matched.candidates[0].name;
                category = matched.candidates[0].categoryName;
            }
            else {
                // Check if all candidates belong to the same category (e.g. plumbing variants)
                const firstCat = matched.candidates[0].categoryName;
                const sameCategory = matched.candidates.every((c) => c.categoryName === firstCat);
                if (sameCategory) {
                    const preferred = bookingType === "EMERGENCY"
                        ? matched.candidates.find((c) => c.name.toLowerCase().includes("emergency"))
                        : matched.candidates.find((c) => !c.name.toLowerCase().includes("emergency"));
                    if (preferred) {
                        serviceId = preferred.id;
                        serviceName = preferred.name;
                        category = preferred.categoryName;
                    }
                }
                candidateServices = matched.candidates.map((c) => ({
                    _id: c.id,
                    name: c.name,
                    categoryName: c.categoryName,
                    firstHourRate: c.firstHourRate,
                    description: c.description,
                }));
            }
        }
        // 3. Resolve Relative Dates
        const extractedDate = this.extractDate(text, input.clientTimezone);
        if (extractedDate) {
            bookingDate = extractedDate;
        }
        // 4. Resolve Time
        const extractedTime = this.extractTime(text);
        if (extractedTime) {
            bookingTime = extractedTime;
        }
        // 5. Resolve Address
        const extractedAddr = this.extractAddress(text, input.customerSavedAddresses);
        if (extractedAddr) {
            customerAddress = extractedAddr;
        }
        // 6. Build Missing Fields list
        const missingFields = [];
        if (!serviceId)
            missingFields.push("service");
        if (bookingType === "SCHEDULED") {
            if (!bookingDate)
                missingFields.push("date");
            if (!bookingTime)
                missingFields.push("time");
        }
        if (!customerAddress)
            missingFields.push("address");
        // 7. Find Matched Catalog Object
        const fullMatchedService = serviceId
            ? input.catalog.find((c) => c.id === serviceId) || null
            : null;
        // 8. Construct Friendly Multilingual Response Message
        const isReadyToBook = Boolean(serviceId && (customerAddress || bookingDate || bookingTime));
        const responseMessage = this.generateMultilingualResponse({
            lang,
            serviceName: fullMatchedService?.name || serviceName,
            candidateServices,
            missingFields,
            bookingDate,
            bookingTime,
            customerAddress,
            bookingType,
            isReadyToBook,
        });
        return {
            intent: serviceId || candidateServices.length > 0 ? "BOOK_SERVICE" : "INQUIRE_SERVICE",
            detectedLanguage: lang,
            confidence: serviceId ? 0.96 : candidateServices.length > 0 ? 0.8 : 0.6,
            matchedService: fullMatchedService
                ? {
                    _id: fullMatchedService.id,
                    name: fullMatchedService.name,
                    description: fullMatchedService.description,
                    category: {
                        _id: fullMatchedService.categoryName,
                        name: fullMatchedService.categoryName,
                    },
                    priceType: fullMatchedService.priceType,
                    firstHourRate: fullMatchedService.firstHourRate,
                    additionalHourRate: fullMatchedService.additionalHourRate,
                    transportFee: fullMatchedService.transportFee,
                }
                : null,
            candidateServices: candidateServices.length > 0 ? candidateServices : undefined,
            serviceName: fullMatchedService?.name || serviceName,
            serviceId,
            category,
            bookingDate,
            bookingTime,
            customerAddress,
            bookingType,
            additionalInstructions,
            missingFields,
            responseMessage,
            isReadyToBook,
        };
    }
    /**
     * Helper: Match spoken text against catalog with multilingual keyword synonyms
     */
    matchServiceFromCatalog(text, catalog) {
        const lower = text.toLowerCase();
        // Multilingual service mappings
        const keywords = {
            plumbing: [
                "plumber", "plumbing", "pipe", "leak", "tap", "drain", "water leak", "drainage",
                "பிளம்பர்", "பிளம்பிங்", "குழாய்", "கசிவு", "நீர்", "தண்ணீர்",
                "प्लंबर", "नल", "पाइप", "लीकेज", "पानी",
                "ప్లంబర్", "పైపు", "లీకేజీ", "నీళ్లు", "నల్లా",
            ],
            electrical: [
                "electrician", "electric", "wiring", "switch", "short circuit", "fan", "light", "power", "breaker",
                "எலக்ட்ரீசியன்", "மின்சாரம்", "வயர்", "ஸ்விட்ச்", "பேன்", "லைட்",
                "इलेक्ट्रीशियन", "बिजली", "वायरिंग", "स्विच", "पंखा",
                "ఎలక్ట్రీషియన్", "కరెంట్", "వైరింగ్", "స్విచ్", "ఫ్యాన్",
            ],
            carpentry: [
                "carpenter", "carpentry", "furniture", "wood", "table", "chair", "door", "hinge", "cupboard",
                "தச்சர்", "மரவேலை", "மர", "மேஜை", "நாற்காலி", "கதவு",
                "बढ़ई", "कारपेंटर", "लकड़ी", "फर्नीचर", "दरवाजा",
                "వడ్రంగి", "చెక్క", "ఫర్నిచర్", "తలుపు",
            ],
        };
        // First: Direct name match
        for (const service of catalog) {
            const sName = service.name.toLowerCase();
            if (lower.includes(sName)) {
                return { exactMatch: service, candidates: [service] };
            }
        }
        // Second: Check for emergency pipe vs tap
        if (lower.includes("pipe") ||
            lower.includes("leak") ||
            lower.includes("குழாய்") ||
            lower.includes("கசிவு") ||
            lower.includes("पाइप") ||
            lower.includes("పైపు")) {
            const pipeService = catalog.find((c) => c.name.toLowerCase().includes("pipe"));
            if (pipeService) {
                return { exactMatch: pipeService, candidates: [pipeService] };
            }
        }
        if (lower.includes("tap") || lower.includes("नल") || lower.includes("நல்")) {
            const tapService = catalog.find((c) => c.name.toLowerCase().includes("tap"));
            if (tapService) {
                return { exactMatch: tapService, candidates: [tapService] };
            }
        }
        // Third: Match against keyword groups
        const matchingCategoryServices = [];
        for (const [group, words] of Object.entries(keywords)) {
            if (words.some((w) => lower.includes(w) || text.includes(w))) {
                const found = catalog.filter((c) => {
                    const cName = c.categoryName.toLowerCase();
                    const sName = c.name.toLowerCase();
                    return cName.includes(group) || sName.includes(group);
                });
                matchingCategoryServices.push(...found);
            }
        }
        // Deduplicate
        const unique = Array.from(new Map(matchingCategoryServices.map((s) => [s.id, s])).values());
        if (unique.length === 1) {
            return { exactMatch: unique[0], candidates: unique };
        }
        if (unique.length > 1) {
            return { candidates: unique };
        }
        // Fourth: Check for generic ambiguous terms like "repair", "fix", "work"
        if (lower.includes("repair") ||
            lower.includes("fix") ||
            lower.includes("fixing") ||
            lower.includes("பழுது") ||
            lower.includes("मरम्मत") ||
            lower.includes("బాగు")) {
            const repairServices = catalog.filter((c) => c.name.toLowerCase().includes("repair") ||
                c.description.toLowerCase().includes("repair") ||
                c.description.toLowerCase().includes("fixing"));
            if (repairServices.length > 0) {
                return { candidates: repairServices };
            }
        }
        return { candidates: [] };
    }
    /**
     * Helper: Resolve relative and explicit dates in timezone
     */
    extractDate(text, tz = "Asia/Kolkata") {
        const lower = text.toLowerCase();
        const now = new Date();
        // Helper to format Date to YYYY-MM-DD in timezone
        const formatDate = (d) => {
            return d.toLocaleDateString("en-CA", { timeZone: tz });
        };
        // Tomorrow patterns:
        if (lower.includes("tomorrow") ||
            lower.includes("நாளை") ||
            lower.includes("நாளைக்கு") ||
            lower.includes("कल") ||
            lower.includes("రేపు")) {
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            return formatDate(tomorrow);
        }
        // Day after tomorrow:
        if (lower.includes("day after tomorrow") ||
            lower.includes("நாளை மறுநாள்") ||
            lower.includes("परसों") ||
            lower.includes("ఎల్లుండి")) {
            const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
            return formatDate(dayAfter);
        }
        // Today:
        if (lower.includes("today") ||
            lower.includes("இன்று") ||
            lower.includes("இன்னைக்கு") ||
            lower.includes("आज") ||
            lower.includes("ఈ రోజు")) {
            return formatDate(now);
        }
        // Explicit date format: YYYY-MM-DD or DD-MM-YYYY
        const isoMatch = text.match(/\b(202\d)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
        if (isoMatch)
            return isoMatch[0];
        const dmyMatch = text.match(/\b(0[1-9]|[12]\d|3[01])[-/](0[1-9]|1[0-2])[-/](202\d)\b/);
        if (dmyMatch) {
            return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
        }
        return null;
    }
    /**
     * Helper: Extract and normalize time to HH:mm (24-hour)
     */
    extractTime(text) {
        const lower = text.toLowerCase();
        // English 12-hour: 10 AM, 10:30 AM, 4 PM, 4:15 PM
        const ampmMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b/i);
        if (ampmMatch) {
            let hours = parseInt(ampmMatch[1], 10);
            const minutes = ampmMatch[2] ? ampmMatch[2] : "00";
            const meridian = ampmMatch[3].toLowerCase().replace(/\./g, "");
            if (meridian === "pm" && hours < 12)
                hours += 12;
            if (meridian === "am" && hours === 12)
                hours = 0;
            return `${String(hours).padStart(2, "0")}:${minutes}`;
        }
        // Tamil time: காலை 10 / மாலை 4 / மதியம் 2
        const taMorning = text.match(/காலை\s*(\d{1,2})/);
        if (taMorning) {
            const h = parseInt(taMorning[1], 10);
            return `${String(h).padStart(2, "0")}:00`;
        }
        const taEvening = text.match(/(?:மாலை|இரவு)\s*(\d{1,2})/);
        if (taEvening) {
            let h = parseInt(taEvening[1], 10);
            if (h < 12)
                h += 12;
            return `${String(h).padStart(2, "0")}:00`;
        }
        const taAfternoon = text.match(/மதியம்\s*(\d{1,2})/);
        if (taAfternoon) {
            let h = parseInt(taAfternoon[1], 10);
            if (h < 12 && h !== 12)
                h += 12;
            return `${String(h).padStart(2, "0")}:00`;
        }
        // Hindi time: सुबह 10 / शाम 4 / दोपहर 2
        const hiMorning = text.match(/सुबह\s*(\d{1,2})/);
        if (hiMorning) {
            const h = parseInt(hiMorning[1], 10);
            return `${String(h).padStart(2, "0")}:00`;
        }
        const hiEvening = text.match(/शाम\s*(\d{1,2})/);
        if (hiEvening) {
            let h = parseInt(hiEvening[1], 10);
            if (h < 12)
                h += 12;
            return `${String(h).padStart(2, "0")}:00`;
        }
        // Telugu time: ఉదయం 10 / సాయంత్రం 4 / మధ్యాహ్నం 2
        const teMorning = text.match(/ఉదయం\s*(\d{1,2})/);
        if (teMorning) {
            const h = parseInt(teMorning[1], 10);
            return `${String(h).padStart(2, "0")}:00`;
        }
        const teEvening = text.match(/సాయంత్రం\s*(\d{1,2})/);
        if (teEvening) {
            let h = parseInt(teEvening[1], 10);
            if (h < 12)
                h += 12;
            return `${String(h).padStart(2, "0")}:00`;
        }
        // 24-hour HH:mm
        const militaryMatch = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
        if (militaryMatch) {
            return `${militaryMatch[1].padStart(2, "0")}:${militaryMatch[2]}`;
        }
        return null;
    }
    /**
     * Helper: Extract address from text
     */
    extractAddress(text, savedAddresses) {
        // Check if user specified a saved address reference ("home", "work")
        const lower = text.toLowerCase();
        if (savedAddresses && savedAddresses.length > 0) {
            if (lower.includes("my home") ||
                lower.includes("home address") ||
                lower.includes("என் வீடு") ||
                lower.includes("घर")) {
                return savedAddresses[0];
            }
        }
        // Common city / area pattern first: "Avadi, Chennai", "Anna Nagar, Chennai", etc.
        const cityMatch = text.match(/([A-Z][a-zA-Z0-9\s]+(?:Chennai|Bangalore|Bengaluru|Hyderabad|Mumbai|Delhi|Coimbatore|Madurai|Trichy|Salem|Kochi))/i);
        if (cityMatch) {
            return cityMatch[1].trim();
        }
        // Clean text of time mentions: e.g. "at 10 AM", "at 4 PM", "at 10:30am"
        const cleanedText = text.replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, "").trim();
        // Pattern: "at [Address]" or "address is [Address]" or "in [Address]"
        const atMatches = [...cleanedText.matchAll(/(?:at|address(?:\s+is)?|in|to)\s+([A-Z0-9][a-zA-Z0-9\s,.-]{4,40})/gi)];
        if (atMatches.length > 0) {
            // Pick the last matched address
            const candidate = atMatches[atMatches.length - 1][1].trim();
            if (!candidate.toLowerCase().includes("am") && !candidate.toLowerCase().includes("pm")) {
                return candidate;
            }
        }
        // Direct mention if the turn is specifically giving an address
        if (text.split(" ").length <= 8 &&
            (text.includes(",") ||
                lower.includes("street") ||
                lower.includes("nagar") ||
                lower.includes("road") ||
                lower.includes("chennai") ||
                lower.includes("avadi"))) {
            return text.trim();
        }
        return null;
    }
    /**
     * Detect Language
     */
    detectLanguage(text) {
        if (/[\u0B80-\u0BFF]/.test(text))
            return "ta"; // Tamil
        if (/[\u0900-\u097F]/.test(text))
            return "hi"; // Hindi
        if (/[\u0C00-\u0C7F]/.test(text))
            return "te"; // Telugu
        if (/[\u0C80-\u0CFF]/.test(text))
            return "kn"; // Kannada
        if (/[\u0D00-\u0D7F]/.test(text))
            return "ml"; // Malayalam
        return "en";
    }
    /**
     * Multilingual response generator
     */
    generateMultilingualResponse(ctx) {
        const { lang, serviceName, candidateServices, missingFields, isReadyToBook } = ctx;
        // Disambiguation
        if (candidateServices.length > 1 && !serviceName) {
            const names = candidateServices.map((c) => c.name).join(", ");
            switch (lang) {
                case "ta":
                    return `பல சேவைகள் பொருந்துகின்றன: ${names}. தயவுசெய்து எந்த சேவையை விரும்புகிறீர்கள் என்று குறிப்பிடவும்.`;
                case "hi":
                    return `कई सेवाएं मेल खाती हैं: ${names}। कृपया बताएं कि आप कौन सी सेवा चाहते हैं?`;
                case "te":
                    return `కొన్ని సేవలు సరిపోలుతున్నాయి: ${names}. దయచేసి మీకు కావలసిన సేవను ఎంచుకోండి.`;
                default:
                    return `Multiple matching services found: ${names}. Which one would you prefer?`;
            }
        }
        // Missing service
        if (!serviceName) {
            switch (lang) {
                case "ta":
                    return "மன்னிக்கவும், நீங்கள் குறிப்பிட்ட சேவை எங்கள் பட்டியலில் இல்லை. பிளம்பிங், எலக்ட்ரிக்கல் அல்லது தச்சு வேலை போன்ற சேவைகளை தேர்வு செய்யலாம்.";
                case "hi":
                    return "क्षमा करें, यह सेवा उपलब्ध नहीं है। आप प्लंबिंग, इलेक्ट्रिकल या बढ़ईगीरी जैसी सेवाएं बुक कर सकते हैं।";
                case "te":
                    return "క్షమించండి, ఆ సేవ అందుబాటులో లేదు. మీరు ప్లంబింగ్, ఎలక్ట్రికల్ లేదా కార్పెంట్రీ సేవలను బుక్ చేసుకోవచ్చు.";
                default:
                    return "I could not find that specific service in our catalog. Would you like to book Plumbing, Electrical, or Carpentry?";
            }
        }
        // Prompt for missing fields
        if (missingFields.includes("time") && !ctx.bookingTime) {
            switch (lang) {
                case "ta":
                    return `${serviceName} சேவைக்கு நீங்கள் எந்த நேரத்தை விரும்புகிறீர்கள்? (எ.கா: காலை 10 மணி அல்லது மாலை 4 மணி)`;
                case "hi":
                    return `${serviceName} के लिए आप किस समय को प्राथमिकता देंगे? (उदा: सुबह 10 बजे या शाम 4 बजे)`;
                case "te":
                    return `${serviceName} సేవ కోసం మీరు ఏ సమయాన్ని కోరుకుంటున్నారు? (ఉదా: ఉదయం 10 గంటలకు)`;
                default:
                    return `What time would you prefer for the ${serviceName}? (e.g., 10 AM or 4 PM)`;
            }
        }
        if (missingFields.includes("address") && !ctx.customerAddress) {
            switch (lang) {
                case "ta":
                    return `பணியாளர் வர வேண்டிய உங்கள் முகவரியை அல்லது இடத்தை குறிப்பிடுங்கள்.`;
                case "hi":
                    return `कारीगर को किस पते पर आना चाहिए? कृपया अपना पता बताएं।`;
                case "te":
                    return `సేవా నిపుణుడు సందర్శించాల్సిన మీ చిరునామా ఏమిటి?`;
                default:
                    return `Which address should the professional visit?`;
            }
        }
        // Ready to review & book
        if (isReadyToBook) {
            switch (lang) {
                case "ta":
                    return `உங்கள் ${serviceName} முன்பதிவு விவரங்கள் தயாராக உள்ளன. முன்பதிவு படிவத்தை சரிபார்த்து உறுதிசெய்யவும்.`;
                case "hi":
                    return `आपकी ${serviceName} बुकिंग की जानकारी तैयार है। कृपया बुकिंग फॉर्म में विवरण जांचें और पुष्टि करें।`;
                case "te":
                    return `మీ ${serviceName} బుకింగ్ వివరాలు సిద్ధంగా ఉన్నాయి. దయచేసి వివరాలను సమీక్షించి నిర్ధారించండి.`;
                default:
                    return `Your ${serviceName} booking details are ready. Please review the booking form and confirm.`;
            }
        }
        return `I am ready to help you book ${serviceName}. Please let me know your preferred date, time, and address.`;
    }
    /**
     * Helper: Format and validate LLM output strictly
     */
    formatAndValidateResponse(raw, input) {
        let serviceId = raw.serviceId || null;
        let serviceName = raw.serviceName || null;
        // Validate that serviceId strictly belongs to the catalog
        let matchedServiceItem = null;
        if (serviceId) {
            matchedServiceItem = input.catalog.find((c) => c.id === serviceId) || null;
            if (!matchedServiceItem) {
                serviceId = null;
            }
        }
        // If serviceName is provided, verify against catalog
        if (!matchedServiceItem && serviceName) {
            matchedServiceItem =
                input.catalog.find((c) => c.name.toLowerCase() === serviceName.toLowerCase()) || null;
            if (matchedServiceItem) {
                serviceId = matchedServiceItem.id;
                serviceName = matchedServiceItem.name;
            }
        }
        const missingFields = [];
        if (!serviceId)
            missingFields.push("service");
        if (!raw.bookingDate)
            missingFields.push("date");
        if (!raw.bookingTime)
            missingFields.push("time");
        if (!raw.customerAddress)
            missingFields.push("address");
        const isReadyToBook = Boolean(serviceId && (raw.customerAddress || raw.bookingDate));
        return {
            intent: raw.intent || (serviceId ? "BOOK_SERVICE" : "INQUIRE_SERVICE"),
            detectedLanguage: raw.detectedLanguage || input.language || "en",
            confidence: typeof raw.confidence === "number" ? raw.confidence : 0.9,
            matchedService: matchedServiceItem
                ? {
                    _id: matchedServiceItem.id,
                    name: matchedServiceItem.name,
                    description: matchedServiceItem.description,
                    category: {
                        _id: matchedServiceItem.categoryName,
                        name: matchedServiceItem.categoryName,
                    },
                    priceType: matchedServiceItem.priceType,
                    firstHourRate: matchedServiceItem.firstHourRate,
                    additionalHourRate: matchedServiceItem.additionalHourRate,
                    transportFee: matchedServiceItem.transportFee,
                }
                : null,
            serviceName: matchedServiceItem?.name || serviceName,
            serviceId,
            category: matchedServiceItem?.categoryName || raw.category || null,
            bookingDate: raw.bookingDate || null,
            bookingTime: raw.bookingTime || null,
            customerAddress: raw.customerAddress || null,
            bookingType: ["EMERGENCY", "PREMIUM", "ON_DEMAND", "SCHEDULED"].includes(raw.bookingType)
                ? raw.bookingType
                : "SCHEDULED",
            additionalInstructions: raw.additionalInstructions || "",
            missingFields,
            responseMessage: raw.responseMessage || "Details extracted successfully.",
            isReadyToBook,
        };
    }
}
exports.LLMService = LLMService;
exports.llmService = new LLMService();
//# sourceMappingURL=llm.service.js.map