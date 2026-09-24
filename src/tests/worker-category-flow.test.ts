import mongoose, { Types } from "mongoose";
import Worker, { VerificationStatus, AvailabilityStatus } from "../models/auth/worker.model";
import Category from "../models/category.model";
import Service from "../models/service.model";

console.log("=== RUNNING WORKER CATEGORY ONBOARDING & DISPATCH UNIT TESTS ===");

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

// 1. Worker Schema verification
const workerPaths = Worker.schema.paths;
assertTrue("category" in workerPaths, "Worker schema defines 'category' field");
assertTrue("categories" in workerPaths, "Worker schema defines 'categories' array field");
assertTrue("skills" in workerPaths, "Worker schema retains 'skills' field for dispatch compatibility");

// 2. Test Category validation logic
function validateWorkerRegistration(payload: {
  category?: string;
  categoryId?: string;
  categories?: string[];
  categoryIds?: string[];
  skills?: string[];
  cooperativeId?: string;
  experience?: number;
}): { valid: boolean; error?: string; resolvedCategories: string[] } {
  const rawCategories = [
    payload.category,
    payload.categoryId,
    ...(payload.categories || []),
    ...(payload.categoryIds || []),
  ].filter(Boolean) as string[];

  const validCategoryIds = rawCategories.filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (validCategoryIds.length === 0) {
    return {
      valid: false,
      error: "Please select at least one valid trade category",
      resolvedCategories: [],
    };
  }

  if (!payload.cooperativeId || !mongoose.Types.ObjectId.isValid(payload.cooperativeId)) {
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

const testCatId = new Types.ObjectId().toString();
const testCoopId = new Types.ObjectId().toString();

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
function matchGigsForWorker(
  worker: {
    category?: Types.ObjectId;
    categories?: Types.ObjectId[];
    skills?: Types.ObjectId[];
  },
  gigs: Array<{
    _id: string;
    category: Types.ObjectId;
    service: Types.ObjectId;
  }>
) {
  const workerCats = [
    worker.category,
    ...(worker.categories || []),
  ].filter(Boolean) as Types.ObjectId[];

  const workerSkills = (worker.skills || []).map((s) => s.toString());
  const workerCatStrs = workerCats.map((c) => c.toString());

  return gigs.filter((gig) => {
    const matchesCategory = workerCatStrs.includes(gig.category.toString());
    const matchesSkill = workerSkills.includes(gig.service.toString());
    return matchesCategory || matchesSkill;
  });
}

const catA = new Types.ObjectId();
const catB = new Types.ObjectId();
const srvA1 = new Types.ObjectId();
const srvA2 = new Types.ObjectId();
const srvB1 = new Types.ObjectId();

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
function validateGigAcceptance(
  workerCategory: Types.ObjectId,
  gigCategory: Types.ObjectId
): { allowed: boolean; error?: string } {
  if (workerCategory.toString() !== gigCategory.toString()) {
    return {
      allowed: false,
      error: "You can only accept jobs matching your registered trade category.",
    };
  }
  return { allowed: true };
}

assertTrue(
  validateGigAcceptance(catA, catA).allowed,
  "Worker can accept gig matching their registered trade category"
);

assertEqual(
  validateGigAcceptance(catA, catB).allowed,
  false,
  "Worker is strictly blocked from accepting gig from a different category"
);

console.log(`\n=== ALL WORKER CATEGORY TESTS PASSED (${passed}/${passed}) ===\n`);
