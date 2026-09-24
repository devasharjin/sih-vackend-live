import mongoose from "mongoose";
import Booking, {
  BookingStatus,
  CancelledByRole,
} from "../models/booking.model";

console.log("=== RUNNING WORKER DAILY CANCELLATION LIMIT UNIT TESTS ===");

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

// 1. Schema Path & Enum Verifications
const bookingPaths = Booking.schema.paths;
assertTrue("status" in bookingPaths, "Booking schema has 'status' field");
assertTrue("cancelledAt" in bookingPaths, "Booking schema has 'cancelledAt' field");
assertTrue("cancelledBy" in bookingPaths, "Booking schema has 'cancelledBy' field");
assertTrue("cancellationReason" in bookingPaths, "Booking schema has 'cancellationReason' field");

assertEqual(BookingStatus.CANCELLED, "CANCELLED", "BookingStatus.CANCELLED is 'CANCELLED'");
assertEqual(CancelledByRole.WORKER, "WORKER", "CancelledByRole.WORKER is 'WORKER'");
assertEqual(CancelledByRole.CUSTOMER, "CUSTOMER", "CancelledByRole.CUSTOMER is 'CUSTOMER'");

// 2. Pure logic cancellation evaluator mimicking updateJobStatus in gig.controller.ts
interface SimulatedBooking {
  _id: string;
  worker: string;
  customer: string;
  status: BookingStatus;
  bookingNumber: string;
  cancelledAt?: Date;
  cancelledBy?: CancelledByRole;
  cancellationReason?: string;
  completedAt?: Date;
}

function countCancellationsToday(
  history: SimulatedBooking[],
  workerId: string,
  referenceDate: Date = new Date()
): number {
  const startOfToday = new Date(referenceDate);
  startOfToday.setHours(0, 0, 0, 0);

  return history.filter((b) => {
    if (b.worker !== workerId) return false;
    if (b.status !== BookingStatus.CANCELLED) return false;
    if (b.cancelledBy !== CancelledByRole.WORKER) return false;
    if (!b.cancelledAt) return false;
    return b.cancelledAt >= startOfToday;
  }).length;
}

function evaluateWorkerCancelRequest(
  booking: SimulatedBooking,
  history: SimulatedBooking[],
  workerId: string,
  reason?: string,
  referenceDate: Date = new Date()
): { success: boolean; statusCode: number; message: string; updatedBooking?: SimulatedBooking } {
  if (booking.worker !== workerId) {
    return { success: false, statusCode: 403, message: "You are not assigned to this job" };
  }

  if (booking.status === BookingStatus.COMPLETED) {
    return { success: false, statusCode: 400, message: "Completed jobs cannot be cancelled" };
  }

  if (booking.status === BookingStatus.CANCELLED) {
    return { success: false, statusCode: 400, message: "Job is already cancelled" };
  }

  const cancellationsToday = countCancellationsToday(history, workerId, referenceDate);

  if (cancellationsToday >= 1) {
    return {
      success: false,
      statusCode: 400,
      message:
        "Daily cancellation limit reached. Workers are allowed to cancel only 1 request per day to maintain cooperative service reliability.",
    };
  }

  const updated: SimulatedBooking = {
    ...booking,
    status: BookingStatus.CANCELLED,
    cancelledAt: new Date(referenceDate),
    cancelledBy: CancelledByRole.WORKER,
    cancellationReason: typeof reason === "string" && reason.trim() ? reason.trim() : "Cancelled by worker",
  };

  return {
    success: true,
    statusCode: 200,
    message: "Job status updated to CANCELLED",
    updatedBooking: updated,
  };
}

// 3. Test Cases Execution
const testWorkerId = "worker_12345";
const testCustomerId = "customer_67890";
const today = new Date();

// Test Case A: Fresh worker with 0 cancellations can cancel 1 job
const job1: SimulatedBooking = {
  _id: "job_001",
  worker: testWorkerId,
  customer: testCustomerId,
  status: BookingStatus.CONFIRMED,
  bookingNumber: "BK-1001",
};

const result1 = evaluateWorkerCancelRequest(job1, [], testWorkerId, "Vehicle breakdown");
assertEqual(result1.success, true, "First cancellation of the day succeeds");
assertEqual(result1.statusCode, 200, "First cancellation returns HTTP 200");
assertEqual(result1.updatedBooking?.status, BookingStatus.CANCELLED, "Job status marked as CANCELLED");
assertEqual(result1.updatedBooking?.cancelledBy, CancelledByRole.WORKER, "CancelledBy set to WORKER");
assertEqual(result1.updatedBooking?.cancellationReason, "Vehicle breakdown", "Cancellation reason recorded");

// Add cancelled job to history
const history: SimulatedBooking[] = [result1.updatedBooking!];

// Test Case B: Second cancellation on the same day must be REJECTED (HTTP 400)
const job2: SimulatedBooking = {
  _id: "job_002",
  worker: testWorkerId,
  customer: testCustomerId,
  status: BookingStatus.CONFIRMED,
  bookingNumber: "BK-1002",
};

const result2 = evaluateWorkerCancelRequest(job2, history, testWorkerId, "Family emergency");
assertEqual(result2.success, false, "Second cancellation on the same day is BLOCKED");
assertEqual(result2.statusCode, 400, "Second cancellation returns HTTP 400");
assertTrue(
  result2.message.includes("Daily cancellation limit reached"),
  "Returns cooperative daily limit message"
);

// Test Case C: Customer cancellation does not count against worker's quota
const customerCancelledJob: SimulatedBooking = {
  _id: "job_cust_cancel",
  worker: testWorkerId,
  customer: testCustomerId,
  status: BookingStatus.CANCELLED,
  cancelledBy: CancelledByRole.CUSTOMER,
  cancelledAt: new Date(),
  bookingNumber: "BK-CUST-1",
};

const historyWithCustomerCancel: SimulatedBooking[] = [customerCancelledJob];
assertEqual(
  countCancellationsToday(historyWithCustomerCancel, testWorkerId),
  0,
  "Customer cancellations do not increment worker's cancellation count"
);

const job3: SimulatedBooking = {
  _id: "job_003",
  worker: testWorkerId,
  customer: testCustomerId,
  status: BookingStatus.CONFIRMED,
  bookingNumber: "BK-1003",
};

const result3 = evaluateWorkerCancelRequest(job3, historyWithCustomerCancel, testWorkerId, "Rain delay");
assertEqual(result3.success, true, "Worker can still cancel if previous cancellation was by customer");

// Test Case D: Cancellations from yesterday do not block worker today
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(14, 30, 0, 0);

const yesterdayCancelledJob: SimulatedBooking = {
  _id: "job_yesterday",
  worker: testWorkerId,
  customer: testCustomerId,
  status: BookingStatus.CANCELLED,
  cancelledBy: CancelledByRole.WORKER,
  cancelledAt: yesterday,
  bookingNumber: "BK-YEST-1",
};

const historyFromYesterday: SimulatedBooking[] = [yesterdayCancelledJob];
assertEqual(
  countCancellationsToday(historyFromYesterday, testWorkerId, today),
  0,
  "Yesterday's cancellation does not count towards today's quota"
);

const result4 = evaluateWorkerCancelRequest(job3, historyFromYesterday, testWorkerId, "Tool failure", today);
assertEqual(result4.success, true, "Worker can cancel today when yesterday had 1 cancellation (daily reset)");

// Test Case E: Completed job cannot be cancelled
const completedJob: SimulatedBooking = {
  _id: "job_completed",
  worker: testWorkerId,
  customer: testCustomerId,
  status: BookingStatus.COMPLETED,
  completedAt: new Date(),
  bookingNumber: "BK-COMP-1",
};

const result5 = evaluateWorkerCancelRequest(completedJob, [], testWorkerId, "Regret completion");
assertEqual(result5.success, false, "Completed job cannot be cancelled");
assertEqual(result5.statusCode, 400, "Completed job cancellation returns HTTP 400");
assertEqual(result5.message, "Completed jobs cannot be cancelled", "Returns expected error message");

// Test Case F: Already cancelled job cannot be cancelled again
const alreadyCancelled: SimulatedBooking = {
  _id: "job_already_cancelled",
  worker: testWorkerId,
  customer: testCustomerId,
  status: BookingStatus.CANCELLED,
  cancelledAt: new Date(),
  cancelledBy: CancelledByRole.WORKER,
  bookingNumber: "BK-ALREADY-1",
};

const result6 = evaluateWorkerCancelRequest(alreadyCancelled, [], testWorkerId, "Repeat cancel");
assertEqual(result6.success, false, "Already cancelled job cannot be cancelled again");
assertEqual(result6.message, "Job is already cancelled", "Returns job already cancelled message");

// Test Case G: Another worker's cancellations do not affect this worker
const otherWorkerId = "worker_99999";
const otherWorkerCancelled: SimulatedBooking = {
  _id: "job_other_worker",
  worker: otherWorkerId,
  customer: testCustomerId,
  status: BookingStatus.CANCELLED,
  cancelledBy: CancelledByRole.WORKER,
  cancelledAt: new Date(),
  bookingNumber: "BK-OTHER-1",
};

const result7 = evaluateWorkerCancelRequest(job3, [otherWorkerCancelled], testWorkerId, "Personal reason");
assertEqual(result7.success, true, "Different worker's cancellation does not affect test worker's quota");

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL WORKER CANCELLATION LIMIT TESTS PASSED SUCCESSFULLY! ✓");
}
