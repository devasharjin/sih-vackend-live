"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../models/auth/user.model");
const worker_model_1 = require("../models/auth/worker.model");
console.log("=== RUNNING SUPER ADMIN FLOW TEST SUITE ===");
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
// 1. User Roles & Account Status Models
assertEqual(user_model_1.UserRole.CUSTOMER, "CUSTOMER", "Customer role enum exists");
assertEqual(user_model_1.UserRole.WORKER, "WORKER", "Worker role enum exists");
assertEqual(user_model_1.UserRole.COOPERATIVE, "COOPERATIVE", "Cooperative role enum exists");
assertEqual(user_model_1.UserRole.SUPERADMIN, "SUPERADMIN", "Superadmin role enum exists");
assertEqual(user_model_1.AccountStatus.ACTIVE, "ACTIVE", "Active account status exists");
assertEqual(user_model_1.AccountStatus.SUSPEND, "SUSPEND", "Suspended account status exists");
assertEqual(user_model_1.AccountStatus.INACTIVE, "INACTIVE", "Inactive account status exists");
// 2. Account Status Mutation Validation Logic
function validateStatusUpdate(targetUserId, currentAdminId, nextStatus) {
    if (targetUserId === currentAdminId) {
        return { valid: false, error: "Cannot modify your own administrative account status" };
    }
    if (!Object.values(user_model_1.AccountStatus).includes(nextStatus)) {
        return { valid: false, error: "Invalid account status specified" };
    }
    return { valid: true };
}
const adminId = "6a9c35777ed57d6abcf849e1";
const targetUserId = "6aa8e29efba43bb788a8f688";
assertEqual(validateStatusUpdate(targetUserId, adminId, user_model_1.AccountStatus.SUSPEND).valid, true, "Admin can suspend a target user account");
assertEqual(validateStatusUpdate(targetUserId, adminId, user_model_1.AccountStatus.ACTIVE).valid, true, "Admin can reinstate suspended user account to ACTIVE");
assertEqual(validateStatusUpdate(adminId, adminId, user_model_1.AccountStatus.SUSPEND).valid, false, "Admin cannot suspend their own session account");
assertEqual(validateStatusUpdate(targetUserId, adminId, "BANNED").valid, false, "Invalid status rejects with validation error");
// 3. User Role Mutation Validation Logic
function validateRoleUpdate(targetUserId, currentAdminId, newRoles) {
    if (!Array.isArray(newRoles) || newRoles.length === 0) {
        return { valid: false, error: "At least one role must be assigned" };
    }
    const validRoles = Object.values(user_model_1.UserRole);
    const hasInvalid = newRoles.some((r) => !validRoles.includes(r));
    if (hasInvalid) {
        return { valid: false, error: "One or more specified roles are invalid" };
    }
    if (targetUserId === currentAdminId && !newRoles.includes(user_model_1.UserRole.SUPERADMIN)) {
        return { valid: false, error: "Cannot revoke SUPERADMIN role from your own session" };
    }
    return { valid: true };
}
assertEqual(validateRoleUpdate(targetUserId, adminId, [user_model_1.UserRole.WORKER, user_model_1.UserRole.CUSTOMER]).valid, true, "Valid multiple role assignment accepted");
assertEqual(validateRoleUpdate(targetUserId, adminId, []).valid, false, "Empty role list rejected");
assertEqual(validateRoleUpdate(targetUserId, adminId, ["GOD_MODE"]).valid, false, "Invalid role rejected");
assertEqual(validateRoleUpdate(adminId, adminId, [user_model_1.UserRole.CUSTOMER]).valid, false, "Self-revocation of SUPERADMIN role prohibited");
// 4. Platform Overview Financial Aggregation Simulation
const sampleOrders = [
    { totalAmount: 310, coopShare: 28, insuranceShare: 14, workerNet: 268 },
    { totalAmount: 280, coopShare: 25, insuranceShare: 12.5, workerNet: 242.5 },
    { totalAmount: 380, coopShare: 35, insuranceShare: 17.5, workerNet: 327.5 },
];
const totalGtv = sampleOrders.reduce((sum, o) => sum + o.totalAmount, 0);
const totalPlatformFee = sampleOrders.reduce((sum, o) => sum + o.coopShare, 0);
const totalWelfarePool = sampleOrders.reduce((sum, o) => sum + o.insuranceShare, 0);
const totalWorkerPayout = sampleOrders.reduce((sum, o) => sum + o.workerNet, 0);
assertEqual(totalGtv, 970, "Gross Transaction Value sums accurately (₹970)");
assertEqual(totalPlatformFee, 88, "Platform fee accurately aggregated (₹88)");
assertEqual(totalWelfarePool, 44, "Welfare insurance pool accurately aggregated (₹44)");
assertEqual(totalWorkerPayout, 838, "Worker net earnings accurately calculated (₹838)");
// 5. Cooperative Verification Statuses
assertEqual(worker_model_1.VerificationStatus.PENDING, "Pending", "Cooperative Pending status exists");
assertEqual(worker_model_1.VerificationStatus.APPROVED, "Approved", "Cooperative Approved status exists");
assertEqual(worker_model_1.VerificationStatus.REJECTED, "Rejected", "Cooperative Rejected status exists");
console.log(`\n=== SUPER ADMIN TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
if (failed > 0) {
    process.exit(1);
}
else {
    console.log("ALL SUPER ADMIN TESTS PASSED SUCCESSFULLY!\n");
}
//# sourceMappingURL=admin-flow.test.js.map