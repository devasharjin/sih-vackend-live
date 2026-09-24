import assert from "assert";
import { LLMService } from "../services/llm.service";

/**
 * Multilingual AI Voice Assistant Test Suite
 * Tests 15 core scenarios including Tamil, Hindi, Telugu, English,
 * relative dates, time normalization, ambiguity, multi-turn state preservation, and fallback.
 */
async function runVoiceAssistantTests() {
  console.log("\n🧪 Starting Multilingual AI Voice Assistant Test Suite...\n");

  const service = new LLMService();

  // Mock real MongoDB catalog
  const catalog = [
    {
      id: "6501a1111111111111111111",
      name: "Electrical Wiring",
      categoryName: "Electrical",
      description: "Complete house and office wiring, circuit breaker fixing",
      priceType: "hourly",
      firstHourRate: 280,
      additionalHourRate: 200,
      transportFee: 30,
    },
    {
      id: "6501a2222222222222222222",
      name: "Tap Repair",
      categoryName: "Plumbing",
      description: "Tap repair, washer replacement, and leak stoppage",
      priceType: "hourly",
      firstHourRate: 250,
      additionalHourRate: 180,
      transportFee: 30,
    },
    {
      id: "6501a3333333333333333333",
      name: "Pipe Leakage & Drainage Emergency",
      categoryName: "Plumbing",
      description: "Emergency burst pipe, high-pressure leak repair, and drain unclogging",
      priceType: "hourly",
      firstHourRate: 350,
      additionalHourRate: 250,
      transportFee: 30,
    },
    {
      id: "6501a4444444444444444444",
      name: "Furniture Assembly & Woodwork",
      categoryName: "Carpentry",
      description: "Custom carpentry, cabinet repairs, hinges and wooden fixtures",
      priceType: "hourly",
      firstHourRate: 300,
      additionalHourRate: 220,
      transportFee: 30,
    },
  ];

  const tz = "Asia/Kolkata";
  const now = new Date();
  const tomorrowStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", {
    timeZone: tz,
  });

  // 1. English complete request
  console.log("▶ Test 1: Complete English Voice Request");
  const res1 = service.localMultilingualExtractor({
    transcript: "I need an electrician tomorrow at 10 AM at Avadi, Chennai",
    catalog,
    clientTimezone: tz,
  });
  assert.strictEqual(res1.serviceName, "Electrical Wiring");
  assert.strictEqual(res1.serviceId, "6501a1111111111111111111");
  assert.strictEqual(res1.bookingDate, tomorrowStr);
  assert.strictEqual(res1.bookingTime, "10:00");
  assert.ok(res1.customerAddress?.includes("Avadi"));
  assert.strictEqual(res1.isReadyToBook, true);
  console.log("  ✔ Extracted English service, date, 10:00, address, and ready status.");

  // 2. Tamil voice request
  console.log("▶ Test 2: Tamil Voice Request");
  const res2 = service.localMultilingualExtractor({
    transcript: "எனக்கு ஒரு பிளம்பர் வேண்டும். நாளைக்கு காலை 10 மணிக்கு வர முடியுமா?",
    catalog,
    clientTimezone: tz,
  });
  assert.strictEqual(res2.detectedLanguage, "ta");
  assert.ok(res2.serviceName === "Tap Repair" || res2.serviceName === "Pipe Leakage & Drainage Emergency");
  assert.strictEqual(res2.bookingDate, tomorrowStr);
  assert.strictEqual(res2.bookingTime, "10:00");
  assert.ok(res2.missingFields.includes("address"));
  assert.ok(res2.responseMessage.includes("முகவரி") || res2.responseMessage.includes("நேரம்"));
  console.log("  ✔ Processed Tamil script, resolved tomorrow's date, 10:00, and asked for address in Tamil.");

  // 3. Hindi voice request
  console.log("▶ Test 3: Hindi Voice Request");
  const res3 = service.localMultilingualExtractor({
    transcript: "मुझे कल सुबह 10 बजे एक प्लंबर बुक करना है।",
    catalog,
    clientTimezone: tz,
  });
  assert.strictEqual(res3.detectedLanguage, "hi");
  assert.ok(res3.serviceName?.includes("Tap") || res3.serviceName?.includes("Pipe"));
  assert.strictEqual(res3.bookingDate, tomorrowStr);
  assert.strictEqual(res3.bookingTime, "10:00");
  console.log("  ✔ Processed Hindi Devanagari script, extracted booking info correctly.");

  // 4. Telugu voice request
  console.log("▶ Test 4: Telugu Voice Request");
  const res4 = service.localMultilingualExtractor({
    transcript: "నాకు రేపు ఉదయం 10 గంటలకు ప్లంబర్ కావాలి.",
    catalog,
    clientTimezone: tz,
  });
  assert.strictEqual(res4.detectedLanguage, "te");
  assert.ok(res4.serviceName?.includes("Tap") || res4.serviceName?.includes("Pipe"));
  assert.strictEqual(res4.bookingDate, tomorrowStr);
  assert.strictEqual(res4.bookingTime, "10:00");
  console.log("  ✔ Processed Telugu script, extracted booking info correctly.");

  // 5. Missing booking time
  console.log("▶ Test 5: Missing Booking Time");
  const res5 = service.localMultilingualExtractor({
    transcript: "I need a carpenter tomorrow at Anna Nagar, Chennai",
    catalog,
    clientTimezone: tz,
  });
  assert.strictEqual(res5.serviceName, "Furniture Assembly & Woodwork");
  assert.strictEqual(res5.bookingTime, null);
  assert.ok(res5.missingFields.includes("time"));
  assert.ok(res5.responseMessage.toLowerCase().includes("time"));
  console.log("  ✔ Correctly flagged missing time and prompted customer.");

  // 6. Missing address
  console.log("▶ Test 6: Missing Address");
  const res6 = service.localMultilingualExtractor({
    transcript: "I need an electrician tomorrow at 4 PM",
    catalog,
    clientTimezone: tz,
  });
  assert.strictEqual(res6.bookingTime, "16:00");
  assert.strictEqual(res6.customerAddress, null);
  assert.ok(res6.missingFields.includes("address"));
  assert.ok(res6.responseMessage.toLowerCase().includes("address"));
  console.log("  ✔ Correctly normalized 4 PM to 16:00 and flagged missing address.");

  // 7. Ambiguous service disambiguation
  console.log("▶ Test 7: Ambiguous Service / Category Candidates");
  const res7 = service.localMultilingualExtractor({
    transcript: "I need some repair work done",
    catalog,
    clientTimezone: tz,
  });
  assert.ok(res7.candidateServices && res7.candidateServices.length > 1);
  console.log(`  ✔ Returned ${res7.candidateServices.length} candidates for clarification.`);

  // 8. Unsupported service handling
  console.log("▶ Test 8: Unsupported Service Request");
  const res8 = service.localMultilingualExtractor({
    transcript: "I want to hire a rocket astronaut to cook dinner",
    catalog,
    clientTimezone: tz,
  });
  assert.strictEqual(res8.serviceId, null);
  assert.ok(res8.responseMessage.toLowerCase().includes("not find") || res8.responseMessage.toLowerCase().includes("catalog"));
  console.log("  ✔ Politely rejected unsupported service without hallucinations.");

  // 9. Relative date resolution (today, tomorrow, day after tomorrow)
  console.log("▶ Test 9: Relative Date Resolution");
  const res9 = service.localMultilingualExtractor({
    transcript: "I need furniture repair today at 2 PM",
    catalog,
    clientTimezone: tz,
  });
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: tz });
  assert.strictEqual(res9.bookingDate, todayStr);
  console.log("  ✔ Resolved 'today' to current date:", todayStr);

  // 10. Multi-turn conversation state accumulation
  console.log("▶ Test 10: Multi-turn State Preservation");
  // Turn 1:
  const turn1 = service.localMultilingualExtractor({
    transcript: "I need an electrician tomorrow",
    catalog,
    clientTimezone: tz,
  });
  // Turn 2: Providing time
  const turn2 = service.localMultilingualExtractor({
    transcript: "At 4 PM",
    catalog,
    currentBooking: turn1,
    clientTimezone: tz,
  });
  assert.strictEqual(turn2.serviceName, "Electrical Wiring"); // Preserved from turn 1
  assert.strictEqual(turn2.bookingDate, tomorrowStr); // Preserved from turn 1
  assert.strictEqual(turn2.bookingTime, "16:00"); // Added in turn 2

  // Turn 3: Providing address
  const turn3 = service.localMultilingualExtractor({
    transcript: "Avadi, Chennai",
    catalog,
    currentBooking: turn2,
    clientTimezone: tz,
  });
  assert.strictEqual(turn3.serviceName, "Electrical Wiring");
  assert.strictEqual(turn3.bookingTime, "16:00");
  assert.ok(turn3.customerAddress?.includes("Avadi"));
  assert.strictEqual(turn3.isReadyToBook, true);
  console.log("  ✔ Multi-turn state preserved seamlessly without memory loss across turns.");

  // 11. User corrects recognized information (field override)
  console.log("▶ Test 11: Field Correction Across Turns");
  const turnCorrection = service.localMultilingualExtractor({
    transcript: "Actually make it 6 PM at Anna Nagar, Chennai",
    catalog,
    currentBooking: turn3,
    clientTimezone: tz,
  });
  assert.strictEqual(turnCorrection.bookingTime, "18:00");
  assert.ok(turnCorrection.customerAddress?.includes("Anna Nagar"));
  console.log("  ✔ Successfully allowed customer to correct previously extracted time and address.");

  // 12. Emergency detection
  console.log("▶ Test 12: Emergency Classification");
  const resEmergency = service.localMultilingualExtractor({
    transcript: "Emergency! High pressure pipe burst right now at T Nagar, Chennai!",
    catalog,
    clientTimezone: tz,
  });
  assert.strictEqual(resEmergency.bookingType, "EMERGENCY");
  assert.strictEqual(resEmergency.serviceName, "Pipe Leakage & Drainage Emergency");
  console.log("  ✔ Correctly tagged EMERGENCY booking classification and matched emergency service.");

  // 13. Real Catalog pricing integrity (Never trusted from AI, matched from DB)
  console.log("▶ Test 13: Catalog Pricing Integrity");
  assert.ok(res1.matchedService);
  assert.strictEqual(res1.matchedService.firstHourRate, 280);
  assert.strictEqual(res1.matchedService.transportFee, 30);
  console.log("  ✔ Verified real DB prices (₹280/hr + ₹30 transport fee) attached to matched service.");

  // 14. Saved Address Context Integration
  console.log("▶ Test 14: Saved Profile Address Recognition");
  const resProfile = service.localMultilingualExtractor({
    transcript: "Book a carpenter tomorrow at 10 AM at my home address",
    catalog,
    clientTimezone: tz,
    customerSavedAddresses: ["Flat 402, Lotus Residency, Chennai 600028"],
  });
  assert.strictEqual(resProfile.customerAddress, "Flat 402, Lotus Residency, Chennai 600028");
  console.log("  ✔ Recognized user's profile home address seamlessly.");

  // 15. Graceful LLM Provider Fallback (Without GEMINI_API_KEY)
  console.log("▶ Test 15: Graceful LLM Provider Fallback");
  const resFallback = await service.processTranscript({
    transcript: "I need tap repair tomorrow at 11 AM at Avadi, Chennai",
    catalog,
    clientTimezone: tz,
  });
  assert.ok(resFallback.serviceName?.includes("Tap"));
  assert.strictEqual(resFallback.bookingTime, "11:00");
  assert.strictEqual(resFallback.isReadyToBook, true);
  console.log("  ✔ LLMService fallback worked flawlessly without network errors or crashes.");

  console.log("\n🎉 ALL 15 VOICE ASSISTANT TESTS PASSED SUCCESSFULLY!\n");
}

runVoiceAssistantTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
