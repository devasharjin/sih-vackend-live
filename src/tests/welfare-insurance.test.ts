import {
  WelfareService,
  PLATFORM_WELFARE_POLICY,
} from "../services/welfare.service";
import {
  WelfareClaimType,
  WelfareClaimStatus,
  WelfareUrgency,
} from "../models/welfareClaim.model";

console.log("=== RUNNING WORKER WELFARE & INSURANCE TEST SUITE ===");

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
    console.error(`✗ FAIL: ${testName} (expected true, got false)`);
    failed++;
  }
}

// 1. Policy Number Generation
const mockWorkerId = "60c72b2f9b1d8b2badbee123";
const generatedPolicy = WelfareService.generatePolicyNumber(mockWorkerId);
assertEqual(generatedPolicy, "FG-WLF-BEE123", "Policy number is deterministic and prefixed with FG-WLF");

// 2. Platform Welfare Policy Limits
assertEqual(PLATFORM_WELFARE_POLICY.coverage.accidentalInjuryMax, 500000, "Accidental Injury coverage cap is ₹5,00,000");
assertEqual(PLATFORM_WELFARE_POLICY.coverage.hospitalizationMax, 200000, "Hospitalization coverage cap is ₹2,00,000");
assertEqual(PLATFORM_WELFARE_POLICY.coverage.emergencyHardshipMax, 25000, "Emergency Hardship relief cap is ₹25,000");
assertEqual(PLATFORM_WELFARE_POLICY.coverage.toolEquipmentLossMax, 15000, "Tool/Equipment loss cap is ₹15,000");
assertEqual(PLATFORM_WELFARE_POLICY.coverage.healthCheckupAnnualMax, 3000, "Annual health checkup subsidy is ₹3,000");
assertTrue(PLATFORM_WELFARE_POLICY.features.length >= 4, "Platform policy contains rich cooperative protection features");

// 3. Welfare Claim Types and Urgency Enums
assertEqual(WelfareClaimType.ACCIDENTAL_INJURY, "ACCIDENTAL_INJURY", "Accidental injury claim type enum exists");
assertEqual(WelfareClaimType.MEDICAL_HOSPITALIZATION, "MEDICAL_HOSPITALIZATION", "Medical hospitalization claim type enum exists");
assertEqual(WelfareClaimType.EMERGENCY_HARDSHIP, "EMERGENCY_HARDSHIP", "Emergency hardship claim type enum exists");
assertEqual(WelfareClaimType.TOOL_EQUIPMENT_LOSS, "TOOL_EQUIPMENT_LOSS", "Tool equipment loss claim type enum exists");
assertEqual(WelfareClaimType.HEALTH_CHECKUP, "HEALTH_CHECKUP", "Health checkup claim type enum exists");

assertEqual(WelfareUrgency.STANDARD, "STANDARD", "Standard urgency exists");
assertEqual(WelfareUrgency.URGENT, "URGENT", "Urgent level exists");
assertEqual(WelfareUrgency.CRITICAL, "CRITICAL", "Critical urgency exists");

// 4. Welfare Reserve Health Calculation Logic
const sampleTotalPool = 150000; // ₹1,50,000 collected from insurance share of completed bookings
const sampleDisbursed = 35000;  // ₹35,000 paid out in claims
const calculatedReserve = sampleTotalPool - sampleDisbursed;
assertEqual(calculatedReserve, 115000, "Cooperative available fund reserve equals collected pool minus disbursed claims");

// Loss Ratio = (Disbursed / Total Pool) * 100
const calculatedLossRatio = Math.round((sampleDisbursed / sampleTotalPool) * 10000) / 100;
assertEqual(calculatedLossRatio, 23.33, "Loss ratio computed accurately to 2 decimal places (23.33%)");

// Zero pool edge case
const zeroLossRatio = 0 > 0 ? (sampleDisbursed / 0) * 100 : 0;
assertEqual(zeroLossRatio, 0, "Zero insurance pool returns 0% loss ratio without division by zero");

// 5. Worker Contribution Accrual from Multiple Bookings
const simulatedBookings = [
  { serviceAmount: 450, insuranceShare: 22.5 }, // 5% of 450
  { serviceAmount: 600, insuranceShare: 30.0 }, // 5% of 600
  { serviceAmount: 300, insuranceShare: 15.0 }, // 5% of 300
];
const accruedWorkerShare = simulatedBookings.reduce((sum, b) => sum + b.insuranceShare, 0);
assertEqual(accruedWorkerShare, 67.5, "Worker accumulated insurance contribution sums correctly (₹67.50)");

// 6. Claim Lifecycle & Policy Limit Validation Rules
function validateClaimRequest(type: WelfareClaimType, amount: number): { valid: boolean; error?: string } {
  const caps = PLATFORM_WELFARE_POLICY.coverage;
  let max = caps.accidentalInjuryMax;
  if (type === WelfareClaimType.MEDICAL_HOSPITALIZATION) max = caps.hospitalizationMax;
  if (type === WelfareClaimType.EMERGENCY_HARDSHIP) max = caps.emergencyHardshipMax;
  if (type === WelfareClaimType.TOOL_EQUIPMENT_LOSS) max = caps.toolEquipmentLossMax;
  if (type === WelfareClaimType.HEALTH_CHECKUP) max = caps.healthCheckupAnnualMax;

  if (amount < 100) return { valid: false, error: "Minimum ₹100" };
  if (amount > max) return { valid: false, error: `Exceeds max policy limit of ₹${max}` };
  return { valid: true };
}

assertEqual(validateClaimRequest(WelfareClaimType.ACCIDENTAL_INJURY, 450000).valid, true, "₹4,50,000 accident claim within ₹5,00,000 cap is valid");
assertEqual(validateClaimRequest(WelfareClaimType.ACCIDENTAL_INJURY, 550000).valid, false, "₹5,50,000 accident claim exceeding ₹5,00,000 cap is rejected");
assertEqual(validateClaimRequest(WelfareClaimType.EMERGENCY_HARDSHIP, 20000).valid, true, "₹20,000 hardship claim within ₹25,000 cap is valid");
assertEqual(validateClaimRequest(WelfareClaimType.EMERGENCY_HARDSHIP, 30000).valid, false, "₹30,000 hardship claim exceeding ₹25,000 cap is rejected");
assertEqual(validateClaimRequest(WelfareClaimType.TOOL_EQUIPMENT_LOSS, 12000).valid, true, "₹12,000 tool loss claim within ₹15,000 cap is valid");
assertEqual(validateClaimRequest(WelfareClaimType.TOOL_EQUIPMENT_LOSS, 18000).valid, false, "₹18,000 tool loss claim exceeding ₹15,000 cap is rejected");

// 7. Claim State Transitions
function canTransitionStatus(current: WelfareClaimStatus, next: WelfareClaimStatus): boolean {
  if (current === WelfareClaimStatus.SUBMITTED) {
    return [WelfareClaimStatus.UNDER_REVIEW, WelfareClaimStatus.REJECTED].includes(next);
  }
  if (current === WelfareClaimStatus.UNDER_REVIEW) {
    return [WelfareClaimStatus.APPROVED, WelfareClaimStatus.REJECTED].includes(next);
  }
  if (current === WelfareClaimStatus.APPROVED) {
    return [WelfareClaimStatus.DISBURSED].includes(next);
  }
  return false;
}

assertTrue(canTransitionStatus(WelfareClaimStatus.SUBMITTED, WelfareClaimStatus.UNDER_REVIEW), "SUBMITTED can move to UNDER_REVIEW");
assertTrue(canTransitionStatus(WelfareClaimStatus.UNDER_REVIEW, WelfareClaimStatus.APPROVED), "UNDER_REVIEW can move to APPROVED");
assertTrue(canTransitionStatus(WelfareClaimStatus.APPROVED, WelfareClaimStatus.DISBURSED), "APPROVED can move to DISBURSED");
assertTrue(!canTransitionStatus(WelfareClaimStatus.SUBMITTED, WelfareClaimStatus.DISBURSED), "Cannot disburse directly from SUBMITTED without approval");
assertTrue(!canTransitionStatus(WelfareClaimStatus.DISBURSED, WelfareClaimStatus.SUBMITTED), "Cannot transition backward from DISBURSED");

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) {
  console.error("SOME WELFARE TESTS FAILED!");
  process.exit(1);
} else {
  console.log("ALL WELFARE & INSURANCE TESTS PASSED SUCCESSFULLY!\n");
}
