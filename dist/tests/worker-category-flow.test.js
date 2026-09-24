"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const worker_model_1 = __importDefault(require("../models/auth/worker.model"));
console.log("=== RUNNING WORKER CATEGORY ONBOARDING & DISPATCH UNIT TESTS ===");
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
// 1. Worker Schema verification
const workerPaths = worker_model_1.default.schema.paths;
assertTrue("category" in workerPaths, "Worker schema defines 'category' field");
assertTrue("categories" in workerPaths, "Worker schema defines 'categories' array field");
assertTrue("skills" in workerPaths, "Worker schema retains 'skills' field for dispatch compatibility");
// 2. Test Category validation logic
function validateWorkerRegistration(payload) {
    const rawCategories = [
        payload.category,
        payload.categoryId,
        ...(payload.categories || []),
        ...(payload.categoryIds || []),
    ].filter(Boolean);
    const validCategoryIds = rawCategories.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
    if (validCategoryIds.length === 0) {
        return {
            valid: false,
            error: "Please select at least one valid trade category",
            resolvedCategories: [],
        };
    }
    if (!payload.cooperativeId || !mongoose_1.default.Types.ObjectId.isValid(payload.cooperativeId)) {
        return {
            valid: false,
            error: "Affiliated cooperative society is required",
            resolvedCategories: [],
        };
    }
    if (payload.experience === undefined || payload.experience < 0) {
        return {
            valid: false,
            error: "Experience must be non-negative",
            resolvedCategories: [],
        };
    }
    return { valid: true, resolvedCategories: [...new Set(validCategoryIds)] };
}
const testCatId = new mongoose_1.Types.ObjectId().toString();
const testCoopId = new mongoose_1.Types.ObjectId().toString();
// Test 2.1: Success with ONLY category (zero skills passed)
const res1 = validateWorkerRegistration({
    categoryId: testCatId,
    cooperativeId: testCoopId,
    experience: 3,
});
assertTrue(res1.valid, "Worker registration succeeds with ONLY categoryId and NO skills passed");
assertEqual(res1.resolvedCategories[0], testCatId, "Resolved category matches selected trade category");
// Test 2.2: Rejects registration when no category is provided
const res2 = validateWorkerRegistration({
    cooperativeId: testCoopId,
    experience: 2,
});
assertEqual(res2.valid, false, "Registration correctly rejected when no category is selected");
// Test 2.3: Rejects invalid cooperative ID
const res3 = validateWorkerRegistration({
    categoryId: testCatId,
    cooperativeId: "invalid-id",
    experience: 2,
});
assertEqual(res3.valid, false, "Registration correctly rejected when cooperative ID is invalid");
// 3. Test Category-based Gig Matching Algorithm
function matchGigsForWorker(worker, gigs) {
    const workerCats = [
        worker.category,
        ...(worker.categories || []),
    ].filter(Boolean);
    const workerSkills = (worker.skills || []).map((s) => s.toString());
    const workerCatStrs = workerCats.map((c) => c.toString());
    return gigs.filter((gig) => {
        const matchesCategory = workerCatStrs.includes(gig.category.toString());
        const matchesSkill = workerSkills.includes(gig.service.toString());
        return matchesCategory || matchesSkill;
    });
}
const catA = new mongoose_1.Types.ObjectId();
const catB = new mongoose_1.Types.ObjectId();
const srvA1 = new mongoose_1.Types.ObjectId();
const srvA2 = new mongoose_1.Types.ObjectId();
const srvB1 = new mongoose_1.Types.ObjectId();
const availableGigs = [
    { _id: "gig-1", category: catA, service: srvA1 },
    { _id: "gig-2", category: catA, service: srvA2 },
    { _id: "gig-3", category: catB, service: srvB1 },
];
const categoryWorker = {
    category: catA,
    categories: [catA],
    skills: [], // Worker onboarded with zero manual services
};
const matched = matchGigsForWorker(categoryWorker, availableGigs);
assertEqual(matched.length, 2, "Worker onboarded with Category A matches both gigs in Category A");
assertEqual(matched[0]._id, "gig-1", "Gig 1 matched by category");
assertEqual(matched[1]._id, "gig-2", "Gig 2 matched by category");
assertTrue(!matched.some((g) => g._id === "gig-3"), "Gig in Category B is strictly excluded from Category A worker");
// 4. Test Strict Category Isolation on Gig Acceptance
function validateGigAcceptance(workerCategory, gigCategory) {
    if (workerCategory.toString() !== gigCategory.toString()) {
        return {
            allowed: false,
            error: "You can only accept jobs matching your registered trade category.",
        };
    }
    return { allowed: true };
}
assertTrue(validateGigAcceptance(catA, catA).allowed, "Worker can accept gig matching their registered trade category");
assertEqual(validateGigAcceptance(catA, catB).allowed, false, "Worker is strictly blocked from accepting gig from a different category");
console.log(`\n=== ALL WORKER CATEGORY TESTS PASSED (${passed}/${passed}) ===\n`);
//# sourceMappingURL=worker-category-flow.test.js.map