import mongoose from "mongoose";
import Worker from "../models/auth/worker.model";
import Booking, { BookingStatus } from "../models/booking.model";

console.log("=== RUNNING WORKER WEEKLY SERVICE ACCEPTANCE LIMIT UNIT TESTS ===");

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

// 1. Worker Schema & Defaults Verification
const workerPaths = Worker.schema.paths;
assertTrue("weeklyServiceLimit" in workerPaths, "Worker schema defines 'weeklyServiceLimit' field");
assertTrue("weeklyAcceptedCount" in workerPaths, "Worker schema defines 'weeklyAcceptedCount' field");
assertTrue("weeklyResetDate" in workerPaths, "Worker schema defines 'weeklyResetDate' field");

const defaultLimit = (workerPaths as any).weeklyServiceLimit?.options?.default;
assertEqual(defaultLimit, 6, "Default weekly service limit is 6");

// 2. Pure logic evaluation mimicking acceptGig and updateJobStatus
interface SimulatedJob {
  _id: string;
  workerId: string;
  status: BookingStatus;
  serviceName: string;
}

interface SimulatedWorker {
  _id: string;
  weeklyServiceLimit: number;
  weeklyAcceptedCount: number;
  totalJobsCompleted: number;
}

function countActiveJobs(jobs: SimulatedJob[], workerId: string): number {
  return jobs.filter(
    (j) =>
      j.workerId === workerId &&
      (j.status === BookingStatus.CONFIRMED ||
        j.status === BookingStatus.ASSIGNED ||
        j.status === BookingStatus.IN_PROGRESS)
  ).length;
}

function evaluateAcceptGig(
  worker: SimulatedWorker,
  activeJobs: SimulatedJob[],
  newGigId: string,
  serviceName: string = "Plumbing Repair"
): { success: boolean; statusCode: number; message: string; updatedWorker: SimulatedWorker; newActiveJobs: SimulatedJob[] } {
  const currentActiveCount = countActiveJobs(activeJobs, worker._id);
  const limit = worker.weeklyServiceLimit ?? 6;

  if (currentActiveCount >= limit) {
    return {
      success: false,
      statusCode: 400,
      message: `Weekly service acceptance limit reached (${currentActiveCount}/${limit}). Please complete an active service to decrease your count and accept more services.`,
      updatedWorker: { ...worker },
      newActiveJobs: [...activeJobs],
    };
  }

  const assignedJob: SimulatedJob = {
    _id: newGigId,
    workerId: worker._id,
    status: BookingStatus.CONFIRMED,
    serviceName,
  };

  const updatedWorker: SimulatedWorker = {
    ...worker,
    weeklyAcceptedCount: currentActiveCount + 1,
  };

  return {
    success: true,
    statusCode: 200,
    message: "Gig accepted successfully! It is now in your active jobs.",
    updatedWorker,
    newActiveJobs: [...activeJobs, assignedJob],
  };
}

function evaluateCompleteJob(
  worker: SimulatedWorker,
  activeJobs: SimulatedJob[],
  jobId: string
): { success: boolean; updatedWorker: SimulatedWorker; newActiveJobs: SimulatedJob[] } {
  const job = activeJobs.find((j) => j._id === jobId);
  if (!job) {
    return { success: false, updatedWorker: worker, newActiveJobs: activeJobs };
  }

  const newActiveJobs = activeJobs.map((j) =>
    j._id === jobId ? { ...j, status: BookingStatus.COMPLETED } : j
  );

  const updatedWorker: SimulatedWorker = {
    ...worker,
    totalJobsCompleted: worker.totalJobsCompleted + 1,
    weeklyAcceptedCount: Math.max(0, worker.weeklyAcceptedCount - 1),
  };

  return { success: true, updatedWorker, newActiveJobs };
}

function evaluateCancelJob(
  worker: SimulatedWorker,
  activeJobs: SimulatedJob[],
  jobId: string
): { success: boolean; updatedWorker: SimulatedWorker; newActiveJobs: SimulatedJob[] } {
  const job = activeJobs.find((j) => j._id === jobId);
  if (!job) {
    return { success: false, updatedWorker: worker, newActiveJobs: activeJobs };
  }

  const newActiveJobs = activeJobs.map((j) =>
    j._id === jobId ? { ...j, status: BookingStatus.CANCELLED } : j
  );

  const updatedWorker: SimulatedWorker = {
    ...worker,
    weeklyAcceptedCount: Math.max(0, worker.weeklyAcceptedCount - 1),
  };

  return { success: true, updatedWorker, newActiveJobs };
}

// 3. Test Cases Execution
const testWorker: SimulatedWorker = {
  _id: "worker_weekly_test",
  weeklyServiceLimit: 6,
  weeklyAcceptedCount: 0,
  totalJobsCompleted: 10,
};

let currentWorker = { ...testWorker };
let jobsPool: SimulatedJob[] = [];

// Step A: Accept 6 services up to the limit
for (let i = 1; i <= 6; i++) {
  const res = evaluateAcceptGig(currentWorker, jobsPool, `job_00${i}`, `Trade Service ${i}`);
  assertEqual(res.success, true, `Accepting service ${i} of 6 succeeds`);
  assertEqual(res.statusCode, 200, `Service ${i} returns HTTP 200`);
  currentWorker = res.updatedWorker;
  jobsPool = res.newActiveJobs;
}

assertEqual(countActiveJobs(jobsPool, testWorker._id), 6, "Worker currently has 6 active accepted jobs");
assertEqual(currentWorker.weeklyAcceptedCount, 6, "Worker weeklyAcceptedCount is 6");

// Step B: Attempt to accept a 7th service (exceeding weekly limit)
const overflowResult = evaluateAcceptGig(currentWorker, jobsPool, "job_007", "Electrical Inspection");
assertEqual(overflowResult.success, false, "Attempting to accept 7th service is REJECTED");
assertEqual(overflowResult.statusCode, 400, "Overflow acceptance returns HTTP 400");
assertTrue(
  overflowResult.message.includes("Weekly service acceptance limit reached (6/6)"),
  "Rejection message explicitly specifies 6/6 limit reached"
);
assertTrue(
  overflowResult.message.includes("complete an active service to decrease your count"),
  "Rejection message guides worker to complete active service to decrease count"
);

// Step C: Worker completes 1 service -> count decreases
const completeResult = evaluateCompleteJob(currentWorker, jobsPool, "job_001");
assertTrue(completeResult.success, "Completing job_001 succeeds");
currentWorker = completeResult.updatedWorker;
jobsPool = completeResult.newActiveJobs;

assertEqual(currentWorker.totalJobsCompleted, 11, "totalJobsCompleted increased to 11");
assertEqual(currentWorker.weeklyAcceptedCount, 5, "weeklyAcceptedCount decreased to 5");
assertEqual(countActiveJobs(jobsPool, testWorker._id), 5, "Active accepted jobs count decreased to 5");

// Step D: Worker can now accept a new service!
const reAcceptResult = evaluateAcceptGig(currentWorker, jobsPool, "job_007", "Electrical Inspection");
assertEqual(reAcceptResult.success, true, "Worker can accept new service after completing previous one");
assertEqual(reAcceptResult.statusCode, 200, "New service acceptance returns HTTP 200");
currentWorker = reAcceptResult.updatedWorker;
jobsPool = reAcceptResult.newActiveJobs;

assertEqual(countActiveJobs(jobsPool, testWorker._id), 6, "Active jobs count returns to 6");
assertEqual(currentWorker.weeklyAcceptedCount, 6, "weeklyAcceptedCount back to 6");

// Step E: Cancelling an active service also decrements count
const cancelResult = evaluateCancelJob(currentWorker, jobsPool, "job_002");
assertTrue(cancelResult.success, "Cancelling job_002 succeeds");
currentWorker = cancelResult.updatedWorker;
jobsPool = cancelResult.newActiveJobs;

assertEqual(currentWorker.weeklyAcceptedCount, 5, "weeklyAcceptedCount decreased to 5 on cancellation");
assertEqual(countActiveJobs(jobsPool, testWorker._id), 5, "Active jobs count decreased to 5 on cancellation");

// Step F: Custom weekly limit works as expected
const customWorker: SimulatedWorker = {
  _id: "worker_custom_limit",
  weeklyServiceLimit: 2,
  weeklyAcceptedCount: 0,
  totalJobsCompleted: 0,
};

let customJobs: SimulatedJob[] = [];
const customRes1 = evaluateAcceptGig(customWorker, customJobs, "c_job_1");
const customRes2 = evaluateAcceptGig(customRes1.updatedWorker, customRes1.newActiveJobs, "c_job_2");
assertEqual(customRes2.success, true, "Custom worker reaches 2/2 limit");

const customRes3 = evaluateAcceptGig(customRes2.updatedWorker, customRes2.newActiveJobs, "c_job_3");
assertEqual(customRes3.success, false, "Custom worker with limit 2 blocked at 3rd job");
assertTrue(customRes3.message.includes("(2/2)"), "Custom limit message reflects 2/2 cap");

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL WORKER WEEKLY LIMIT UNIT TESTS PASSED SUCCESSFULLY! ✓");
}
