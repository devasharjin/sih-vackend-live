"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const billing_service_1 = require("../services/billing.service");
console.log("=== RUNNING BILLING & SALARY DISTRIBUTION TEST SUITE ===");
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
function assertThrows(fn, testName) {
    try {
        fn();
        console.error(`✗ FAIL: ${testName} (expected to throw error, but succeeded)`);
        failed++;
    }
    catch (err) {
        console.log(`✓ PASS: ${testName} (threw error: "${err.message}")`);
        passed++;
    }
}
// Pricing benchmark rates
const samplePricing = {
    firstHourRate: 300,
    additionalHourRate: 150,
    cooperativePercentage: 10,
    insurancePercentage: 5,
    transportFee: billing_service_1.FIXED_TRANSPORT_FEE, // 30
};
// Test Case 1: 30 minutes duration
// Formula: Math.ceil(30 / 60) = 1 billable hour
// Service Amount = 300 + (1 - 1)*150 = 300
// Customer Total = 300 + 30 = 330
const res30 = billing_service_1.BillingService.calculateBillingAndDistribution(30, samplePricing);
assertEqual(res30.billableHours, 1, "30m duration -> 1 billable hour");
assertEqual(res30.serviceAmount, 300, "30m duration -> Service amount ₹300");
assertEqual(res30.transportFee, 30, "30m duration -> Transport fee ₹30");
assertEqual(res30.customerTotal, 330, "30m duration -> Customer total ₹330");
assertEqual(res30.cooperativeAdminShare, 30, "30m duration -> Coop share 10% of ₹300 = ₹30");
assertEqual(res30.insuranceShare, 15, "30m duration -> Insurance share 5% of ₹300 = ₹15");
assertEqual(res30.workerNetEarnings, 255, "30m duration -> Worker net earnings 300 - 30 - 15 = ₹255");
// Test Case 2: 60 minutes duration
// Formula: Math.ceil(60 / 60) = 1 billable hour
// Service Amount = 300 + 0 = 300
// Customer Total = 300 + 30 = 330
const res60 = billing_service_1.BillingService.calculateBillingAndDistribution(60, samplePricing);
assertEqual(res60.billableHours, 1, "60m duration -> 1 billable hour");
assertEqual(res60.serviceAmount, 300, "60m duration -> Service amount ₹300");
assertEqual(res60.customerTotal, 330, "60m duration -> Customer total ₹330");
assertEqual(res60.workerNetEarnings, 255, "60m duration -> Worker net earnings ₹255");
// Test Case 3: 61 minutes duration
// Formula: Math.ceil(61 / 60) = 2 billable hours
// Service Amount = 300 + (2 - 1)*150 = 450
// Customer Total = 450 + 30 = 480
const res61 = billing_service_1.BillingService.calculateBillingAndDistribution(61, samplePricing);
assertEqual(res61.billableHours, 2, "61m duration -> 2 billable hours");
assertEqual(res61.firstHourCharge, 300, "61m duration -> First hour charge ₹300");
assertEqual(res61.additionalHoursCharge, 150, "61m duration -> Additional hours charge ₹150");
assertEqual(res61.serviceAmount, 450, "61m duration -> Service amount ₹450");
assertEqual(res61.customerTotal, 480, "61m duration -> Customer total ₹480");
assertEqual(res61.cooperativeAdminShare, 45, "61m duration -> Coop share 10% of ₹450 = ₹45");
assertEqual(res61.insuranceShare, 22.5, "61m duration -> Insurance share 5% of ₹450 = ₹22.50");
assertEqual(res61.workerNetEarnings, 382.5, "61m duration -> Worker net earnings 450 - 45 - 22.5 = ₹382.50");
// Test Case 4: 120 minutes duration
// Formula: Math.ceil(120 / 60) = 2 billable hours
// Service Amount = 300 + 150 = 450
// Customer Total = 450 + 30 = 480
const res120 = billing_service_1.BillingService.calculateBillingAndDistribution(120, samplePricing);
assertEqual(res120.billableHours, 2, "120m duration -> 2 billable hours");
assertEqual(res120.serviceAmount, 450, "120m duration -> Service amount ₹450");
assertEqual(res120.customerTotal, 480, "120m duration -> Customer total ₹480");
assertEqual(res120.workerNetEarnings, 382.5, "120m duration -> Worker net earnings ₹382.50");
// Test Case 5: 121 minutes duration
// Formula: Math.ceil(121 / 60) = 3 billable hours
// Service Amount = 300 + (3 - 1)*150 = 600
// Customer Total = 600 + 30 = 630
const res121 = billing_service_1.BillingService.calculateBillingAndDistribution(121, samplePricing);
assertEqual(res121.billableHours, 3, "121m duration -> 3 billable hours");
assertEqual(res121.firstHourCharge, 300, "121m duration -> First hour charge ₹300");
assertEqual(res121.additionalHoursCharge, 300, "121m duration -> Additional hours charge ₹300");
assertEqual(res121.serviceAmount, 600, "121m duration -> Service amount ₹600");
assertEqual(res121.customerTotal, 630, "121m duration -> Customer total ₹630");
assertEqual(res121.cooperativeAdminShare, 60, "121m duration -> Coop share 10% of ₹600 = ₹60");
assertEqual(res121.insuranceShare, 30, "121m duration -> Insurance share 5% of ₹600 = ₹30");
assertEqual(res121.workerNetEarnings, 510, "121m duration -> Worker net earnings 600 - 60 - 30 = ₹510");
// Test Case 6: Negative and invalid duration checks
const start = new Date("2026-09-19T10:00:00Z");
const earlier = new Date("2026-09-19T09:30:00Z");
const later = new Date("2026-09-19T11:15:00Z");
assertThrows(() => billing_service_1.BillingService.calculateWorkingDurationMinutes(start, earlier), "Negative duration (completed < started) throws error");
const durationCalc = billing_service_1.BillingService.calculateWorkingDurationMinutes(start, later);
assertEqual(durationCalc, 75, "75m between 10:00 and 11:15");
// Test Case 7: Validation of share percentages (>100%)
assertThrows(() => billing_service_1.BillingService.calculateBillingAndDistribution(60, {
    ...samplePricing,
    cooperativePercentage: 80,
    insurancePercentage: 30, // 80 + 30 = 110% > 100%
}), "Combined shares > 100% throws error");
// Test Case 8: Fixed Transport Fee Isolation
// Verify transport fee is not deducted from worker salary
assertEqual(res61.workerNetEarnings + res61.cooperativeAdminShare + res61.insuranceShare, res61.serviceAmount, "Deductions sum exactly to gross service earnings without touching transport fee");
console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) {
    process.exit(1);
}
else {
    console.log("ALL TEST CASES PASSED SUCCESSFULLY!");
}
//# sourceMappingURL=billing.test.js.map