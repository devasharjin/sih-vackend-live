"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../models/auth/user.model");
const worker_model_1 = require("../models/auth/worker.model");
console.log("=== RUNNING COOPERATIVE FLOW UNIT TEST SUITE ===");
let passed = 0;
let failed = 0;
function assertEqual(actual, expected, testName) {
    if (actual === expected) {
        console.log(`✓ PASS: ${testName} (expected: ${expected}, got: ${actual})`);
        passed++;
    }
    else {
        console.error(`✗ FAIL: ${testName} (expected: ${expected}, got: ${actual})`);
        failed++;
    }
}
function assertTrue(condition, testName) {
    if (condition) {
        console.log(`✓ PASS: ${testName}`);
        passed++;
    }
    else {
        console.error(`✗ FAIL: ${testName} (expected true, got false)`);
        failed++;
    }
}
// 1. Cooperative Roles and Enums
assertEqual(user_model_1.UserRole.COOPERATIVE, "COOPERATIVE", "Cooperative role exists in UserRole enum");
assertEqual(worker_model_1.VerificationStatus.APPROVED, "Approved", "Worker Approved verification status is correct");
assertEqual(worker_model_1.VerificationStatus.PENDING, "Pending", "Worker Pending verification status is correct");
assertEqual(worker_model_1.VerificationStatus.REJECTED, "Rejected", "Worker Rejected verification status is correct");
// 2. Test Member Status Toggle & Availability Logic
function validateMemberUpdate(isActive, availability) {
    if (typeof isActive !== "boolean" && !availability) {
        return { valid: false, error: "No update parameters provided" };
    }
    if (availability &&
        !Object.values(worker_model_1.AvailabilityStatus).includes(availability)) {
        return { valid: false, error: "Invalid availability status" };
    }
    return { valid: true };
}
assertTrue(validateMemberUpdate(true, undefined).valid, "Can toggle worker active status");
assertTrue(validateMemberUpdate(undefined, worker_model_1.AvailabilityStatus.PART_TIME).valid, "Can update worker availability");
assertEqual(validateMemberUpdate(undefined, "INVALID_STATUS").valid, false, "Rejects invalid worker availability status");
console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
    process.exit(1);
}
//# sourceMappingURL=cooperative-flow.test.js.map