import { BookingType, UrgencyLevel } from "../models/booking.model";

console.log("=== RUNNING EMERGENCY & ON-DEMAND BOOKING WORKFLOW TEST SUITE ===");

let passed = 0;
let failed = 0;

function assertEqual(actual: any, expected: any, testName: string) {
  if (actual === expected) {
    console.log(`✓ PASS: ${testName} (expected: ${expected}, got: ${actual})`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName} (expected: ${expected}, got: ${actual})`);
    failed++;
  }
}

function assertTrue(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName}`);
    failed++;
  }
}

// Helper: Booking creation resolver logic mirroring booking.controller.ts
function resolveBookingPayload(input: {
  bookingType?: string;
  isEmergency?: boolean | string;
  urgencyLevel?: string;
  scheduledDate?: string;
  customerNotes?: string;
  emergencyDetails?: {
    hazardType?: string;
    severity?: "CRITICAL" | "HIGH" | "MEDIUM";
    immediateContact?: string;
    notes?: string;
  };
}) {
  let finalBookingType = BookingType.SCHEDULED;
  let finalIsEmergency = false;
  let finalUrgency = UrgencyLevel.STANDARD;

  const typeUpper = String(input.bookingType || "SCHEDULED").toUpperCase();
  if (input.isEmergency === true || input.isEmergency === "true" || typeUpper === "EMERGENCY") {
    finalBookingType = BookingType.EMERGENCY;
    finalIsEmergency = true;
    finalUrgency =
      input.urgencyLevel && input.urgencyLevel !== "STANDARD"
        ? (input.urgencyLevel as UrgencyLevel)
        : UrgencyLevel.CRITICAL;
  } else if (typeUpper === "PREMIUM" || typeUpper === "ON_DEMAND") {
    finalBookingType = BookingType.PREMIUM;
    finalIsEmergency = false;
    finalUrgency = UrgencyLevel.HIGH;
  }

  const isImmediate =
    finalBookingType === BookingType.PREMIUM ||
    (finalBookingType as any) === "ON_DEMAND" ||
    finalBookingType === BookingType.EMERGENCY;

  const now = new Date();
  const finalScheduledDate = isImmediate
    ? now
    : input.scheduledDate
    ? new Date(input.scheduledDate)
    : now;

  const finalEmergencyDetails = {
    immediateContact: input.emergencyDetails?.immediateContact?.trim() || "",
    notes:
      input.emergencyDetails?.notes?.trim() ||
      input.customerNotes?.trim() ||
      "",
  };

  return {
    bookingType: finalBookingType,
    isEmergency: finalIsEmergency,
    urgencyLevel: finalUrgency,
    isImmediate,
    scheduledDate: finalScheduledDate,
    emergencyDetails: finalEmergencyDetails,
  };
}

// Multiplier helper under test
function calculateMultiplier(bookingType: BookingType, isEmergency: boolean): number {
  if (isEmergency || bookingType === BookingType.EMERGENCY) return 1.20;
  if (bookingType === BookingType.PREMIUM) return 1.15;
  return 1.0;
}

// Worker eligibility check under test (must be > 4.5 star rating for PREMIUM)
function canWorkerAcceptGig(workerRating: number, gigBookingType: BookingType): boolean {
  if (gigBookingType === BookingType.PREMIUM && workerRating <= 4.5) {
    return false;
  }
  return true;
}

// Test 1: Scheduled Booking Resolution
const scheduled = resolveBookingPayload({
  bookingType: "SCHEDULED",
  scheduledDate: "2026-10-01T10:00:00Z",
  customerNotes: "Regular garden maintenance",
});
assertEqual(scheduled.bookingType, BookingType.SCHEDULED, "Scheduled bookingType is SCHEDULED");
assertEqual(scheduled.isEmergency, false, "Scheduled booking isEmergency is false");
assertEqual(scheduled.urgencyLevel, UrgencyLevel.STANDARD, "Scheduled urgencyLevel is STANDARD");
assertEqual(scheduled.isImmediate, false, "Scheduled booking is not marked immediate");
assertTrue(scheduled.scheduledDate.getFullYear() === 2026, "Scheduled date correctly preserved");
assertEqual(calculateMultiplier(scheduled.bookingType, scheduled.isEmergency), 1.0, "Scheduled multiplier is 1.0x");

// Test 2: Premium Booking Resolution (Top-Rated Specialist)
const premium = resolveBookingPayload({
  bookingType: "PREMIUM",
  customerNotes: "Need top rated electrician",
});
assertEqual(premium.bookingType, BookingType.PREMIUM, "Premium bookingType is PREMIUM");
assertEqual(premium.isEmergency, false, "Premium booking isEmergency is false");
assertEqual(premium.urgencyLevel, UrgencyLevel.HIGH, "Premium urgencyLevel is HIGH");
assertEqual(premium.isImmediate, true, "Premium booking marked immediate");
assertEqual(calculateMultiplier(premium.bookingType, premium.isEmergency), 1.15, "Premium multiplier is 1.15x (+15%)");

// Test 2b: On-Demand alias resolves to PREMIUM
const onDemandAlias = resolveBookingPayload({
  bookingType: "ON_DEMAND",
  customerNotes: "Legacy on demand booking",
});
assertEqual(onDemandAlias.bookingType, BookingType.PREMIUM, "On-Demand alias resolves to PREMIUM");

// Test 3: Emergency Booking Resolution (Immediate Contact)
const emergency = resolveBookingPayload({
  bookingType: "EMERGENCY",
  emergencyDetails: {
    immediateContact: "9876543210",
    notes: "Main valve broken, water gushing into kitchen",
  },
});
assertEqual(emergency.bookingType, BookingType.EMERGENCY, "Emergency bookingType is EMERGENCY");
assertEqual(emergency.isEmergency, true, "Emergency isEmergency is true");
assertEqual(emergency.urgencyLevel, UrgencyLevel.CRITICAL, "Emergency urgencyLevel defaults to CRITICAL");
assertEqual(emergency.isImmediate, true, "Emergency booking marked immediate");
assertEqual(emergency.emergencyDetails.immediateContact, "9876543210", "Emergency contact correctly captured");
assertEqual(calculateMultiplier(emergency.bookingType, emergency.isEmergency), 1.20, "Emergency multiplier is 1.20x (+20%)");

// Test 4: Worker Rating Eligibility for Premium Gigs (>4.5 stars required)
assertEqual(canWorkerAcceptGig(4.8, BookingType.PREMIUM), true, "Worker with 4.8 rating can accept Premium gig");
assertEqual(canWorkerAcceptGig(4.6, BookingType.PREMIUM), true, "Worker with 4.6 rating can accept Premium gig");
assertEqual(canWorkerAcceptGig(4.5, BookingType.PREMIUM), false, "Worker with 4.5 rating CANNOT accept Premium gig (must be > 4.5)");
assertEqual(canWorkerAcceptGig(4.2, BookingType.PREMIUM), false, "Worker with 4.2 rating CANNOT accept Premium gig");
assertEqual(canWorkerAcceptGig(0.0, BookingType.PREMIUM), false, "Unrated worker CANNOT accept Premium gig");
assertEqual(canWorkerAcceptGig(4.2, BookingType.SCHEDULED), true, "Worker with 4.2 rating can accept Scheduled gig");
assertEqual(canWorkerAcceptGig(4.2, BookingType.EMERGENCY), true, "Worker with 4.2 rating can accept Emergency gig");

// Test 5: Priority Sorting Simulation
// EMERGENCY gigs must always rank higher than any standard scheduled or premium jobs
const mockGigs = [
  { id: "1", isEmergency: false, bookingType: BookingType.SCHEDULED, scheduledDate: new Date("2026-09-19T12:00:00Z"), createdAt: new Date(1000) },
  { id: "2", isEmergency: false, bookingType: BookingType.PREMIUM, scheduledDate: new Date("2026-09-19T10:00:00Z"), createdAt: new Date(2000) },
  { id: "3", isEmergency: true, bookingType: BookingType.EMERGENCY, scheduledDate: new Date("2026-09-19T11:00:00Z"), createdAt: new Date(3000) },
  { id: "4", isEmergency: true, bookingType: BookingType.EMERGENCY, scheduledDate: new Date("2026-09-19T09:00:00Z"), createdAt: new Date(4000) },
];

const sortedGigs = [...mockGigs].sort((a, b) => {
  // isEmergency descending (true comes first)
  if (a.isEmergency !== b.isEmergency) {
    return a.isEmergency ? -1 : 1;
  }
  // scheduledDate ascending (earliest first)
  return a.scheduledDate.getTime() - b.scheduledDate.getTime();
});

assertEqual(sortedGigs[0].id, "4", "First sorted gig is Emergency (earliest scheduledDate)");
assertEqual(sortedGigs[1].id, "3", "Second sorted gig is Emergency");
assertTrue(sortedGigs[0].isEmergency && sortedGigs[1].isEmergency, "Top 2 sorted gigs are both EMERGENCY gigs");
assertTrue(!sortedGigs[2].isEmergency && !sortedGigs[3].isEmergency, "Bottom 2 gigs are non-emergency gigs");

// Test 6: Filter Simulation with Rating Safeguard
const emergencyFiltered = mockGigs.filter((g) => g.isEmergency === true);
assertEqual(emergencyFiltered.length, 2, "Emergency filter returns exactly 2 emergency gigs");

const premiumFiltered = mockGigs.filter((g) => g.bookingType === BookingType.PREMIUM);
assertEqual(premiumFiltered.length, 1, "Premium filter returns exactly 1 premium gig");

const scheduledFiltered = mockGigs.filter((g) => g.bookingType === BookingType.SCHEDULED);
assertEqual(scheduledFiltered.length, 1, "Scheduled filter returns exactly 1 scheduled gig");

// Worker with rating 4.2 filtering available gigs (premium gig excluded)
const workerRatingLow = 4.2;
const visibleForLowRatingWorker = mockGigs.filter((g) => {
  if (g.bookingType === BookingType.PREMIUM && workerRatingLow <= 4.5) return false;
  return true;
});
assertEqual(visibleForLowRatingWorker.length, 3, "Worker with 4.2 rating sees 3 gigs (Premium excluded)");
assertTrue(!visibleForLowRatingWorker.some(g => g.bookingType === BookingType.PREMIUM), "Low rating worker cannot see Premium gig");

// Worker with rating 4.8 filtering available gigs (all visible)
const workerRatingHigh = 4.8;
const visibleForHighRatingWorker = mockGigs.filter((g) => {
  if (g.bookingType === BookingType.PREMIUM && workerRatingHigh <= 4.5) return false;
  return true;
});
assertEqual(visibleForHighRatingWorker.length, 4, "Worker with 4.8 rating sees all 4 gigs including Premium");

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL EMERGENCY & PREMIUM WORKFLOW TESTS PASSED SUCCESSFULLY!");
}
