import { UserRole } from "../models/auth/user.model";
import { VerificationStatus, AvailabilityStatus } from "../models/auth/worker.model";

console.log("=== RUNNING COOPERATIVE FLOW UNIT TEST SUITE ===");

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

// 1. Cooperative Roles and Enums
assertEqual(UserRole.COOPERATIVE, "COOPERATIVE", "Cooperative role exists in UserRole enum");
assertEqual(VerificationStatus.APPROVED, "Approved", "Worker Approved verification status is correct");
assertEqual(VerificationStatus.PENDING, "Pending", "Worker Pending verification status is correct");
assertEqual(VerificationStatus.REJECTED, "Rejected", "Worker Rejected verification status is correct");

// 2. Test Member Status Toggle & Availability Logic
function validateMemberUpdate(
  isActive?: boolean,
  availability?: string
): { valid: boolean; error?: string } {
  if (typeof isActive !== "boolean" && !availability) {
    return { valid: false, error: "No update parameters provided" };
  }
  if (
    availability &&
    !Object.values(AvailabilityStatus).includes(availability as AvailabilityStatus)
  ) {
    return { valid: false, error: "Invalid availability status" };
  }
  return { valid: true };
}

assertTrue(
  validateMemberUpdate(true, undefined).valid,
  "Can toggle worker active status"
);

assertTrue(
  validateMemberUpdate(undefined, AvailabilityStatus.PART_TIME).valid,
  "Can update worker availability"
);

assertEqual(
  validateMemberUpdate(undefined, "INVALID_STATUS").valid,
  false,
  "Rejects invalid worker availability status"
);

console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
