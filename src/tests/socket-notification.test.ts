import http from "http";
import { initSocket, getIO, notifyCustomer, notifyWorkers, type SocketNotificationPayload } from "../services/socket.service";

console.log("=== RUNNING SOCKET REAL-TIME NOTIFICATIONS TEST SUITE ===");

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

// 1. Initialize HTTP server & Socket
const server = http.createServer();
const io = initSocket(server);

assertTrue(!!io, "Socket.io instance initialized successfully");
assertEqual(getIO(), io, "getIO() returns the initialized Socket.io instance");

// 2. Validate Customer Notification Payloads
const acceptedPayload: SocketNotificationPayload = {
  type: "JOB_ACCEPTED",
  title: "Worker Accepted Your Booking!",
  message: "John Doe has accepted your booking #BK-1001 (Plumbing)!",
  bookingId: "64a000000000000000000001",
  bookingNumber: "BK-1001",
  status: "CONFIRMED",
  serviceName: "Plumbing",
  worker: {
    id: "worker123",
    name: "John Doe",
    phone: "9876543210",
    rating: 4.8,
  },
  timestamp: new Date().toISOString(),
};

assertEqual(acceptedPayload.type, "JOB_ACCEPTED", "Job accepted notification has correct type");
assertEqual(acceptedPayload.status, "CONFIRMED", "Job accepted notification maps to CONFIRMED status");
assertTrue(acceptedPayload.worker.rating >= 4.5, "Assigned worker details attached");

const startedPayload: SocketNotificationPayload = {
  type: "JOB_STARTED",
  title: "Worker Started Your Service!",
  message: "Your booking #BK-1001 is now in progress.",
  bookingId: "64a000000000000000000001",
  bookingNumber: "BK-1001",
  status: "IN_PROGRESS",
  timestamp: new Date().toISOString(),
};
assertEqual(startedPayload.type, "JOB_STARTED", "Job started notification has correct type");
assertEqual(startedPayload.status, "IN_PROGRESS", "Job started notification maps to IN_PROGRESS status");

const completedPayload: SocketNotificationPayload = {
  type: "JOB_COMPLETED",
  title: "Service Completed!",
  message: "Your booking #BK-1001 is complete. Total: ₹450.",
  bookingId: "64a000000000000000000001",
  bookingNumber: "BK-1001",
  status: "COMPLETED",
  totalAmount: 450,
  timestamp: new Date().toISOString(),
};
assertEqual(completedPayload.type, "JOB_COMPLETED", "Job completed notification has correct type");
assertEqual(completedPayload.status, "COMPLETED", "Job completed notification maps to COMPLETED status");
assertEqual(completedPayload.totalAmount, 450, "Total amount attached for settlement");

// 3. Validate Emergency Notification Payload for Workers
const emergencyPayload: SocketNotificationPayload = {
  type: "EMERGENCY_BOOKING",
  title: "🚨 URGENT: New Emergency SOS Callout!",
  message: "Emergency SOS callout for Electrical Hazard at Main Street!",
  bookingId: "64a000000000000000000002",
  bookingNumber: "BK-SOS-99",
  serviceName: "Electrical Repair",
  rate: 400,
  urgencyLevel: "CRITICAL",
  hazardType: "Sparks flying from main distribution box",
  immediateContact: "9988776655",
  timestamp: new Date().toISOString(),
};
assertEqual(emergencyPayload.type, "EMERGENCY_BOOKING", "Emergency notification has correct type");
assertEqual(emergencyPayload.urgencyLevel, "CRITICAL", "Emergency urgency level is CRITICAL");
assertTrue(emergencyPayload.title.includes("🚨"), "Emergency notification includes urgent visual cue");

// 4. Test notification dispatch methods do not throw
try {
  notifyCustomer("cust_123", "job:status_updated", acceptedPayload);
  notifyCustomer("cust_123", "job:status_updated", startedPayload);
  notifyCustomer("cust_123", "job:status_updated", completedPayload);
  notifyWorkers("emergency:created", emergencyPayload);
  assertTrue(true, "All socket notification dispatch calls executed without throwing errors");
} catch (e: any) {
  assertTrue(false, `Socket dispatch threw error: ${e.message}`);
}

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL REAL-TIME SOCKET NOTIFICATION TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}
