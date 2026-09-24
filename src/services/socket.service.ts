import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

let io: SocketIOServer | null = null;

export interface SocketNotificationPayload {
  type: string;
  title: string;
  message: string;
  bookingId?: string;
  bookingNumber?: string;
  status?: string;
  timestamp?: string;
  data?: Record<string, any>;
  [key: string]: any;
}

/**
 * Initialize Socket.io on the shared HTTP server
 */
export function initSocket(server: http.Server): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || "https://devasharjin.github.io/fairgigs",
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);

    // Join room based on user role and ID
    socket.on("join", (data: { role?: string | string[]; roles?: string[]; userId?: string }) => {
      const { role, roles, userId } = data || {};
      
      if (userId) {
        // Individual user room (for customer notifications, direct alerts)
        socket.join(`user:${userId}`);
        socket.join(`customer:${userId}`);
        console.log(`👤 [Socket.io] Socket ${socket.id} joined rooms user:${userId}`);
      }

      const allRoles = [
        ...(Array.isArray(role) ? role : [role]),
        ...(Array.isArray(roles) ? roles : [roles]),
      ]
        .filter(Boolean)
        .map((r) => String(r).toUpperCase());

      if (allRoles.includes("WORKER") || String(role || "").toUpperCase() === "WORKER") {
        // Worker broadcast room (for new emergency gigs, broadcasting)
        socket.join("workers");
        if (userId) {
          socket.join(`worker:${userId}`);
        }
        console.log(`🛠️ [Socket.io] Socket ${socket.id} joined 'workers' room`);
      }
    });

    // Handle client-side emergency dispatch event directly from customer
    socket.on("emergency:dispatched", (payload: any) => {
      console.log("⚡ [Socket.io] Received emergency:dispatched from client:", payload);
      notifyWorkers("emergency:created", {
        type: "EMERGENCY_BOOKING",
        title: "🚨 URGENT: New Emergency SOS Callout!",
        message: `Emergency SOS callout for ${payload?.serviceName || "Emergency Service"} at ${payload?.address?.street || payload?.address || "Customer Location"}!`,
        bookingId: payload?.bookingId,
        bookingNumber: payload?.bookingNumber,
        serviceName: payload?.serviceName,
        categoryName: payload?.categoryName || "Emergency Service",
        rate: payload?.rate,
        totalAmount: payload?.totalAmount || payload?.rate,
        address: payload?.address,
        urgencyLevel: payload?.urgencyLevel || "CRITICAL",
        hazardType: payload?.hazardType,
        immediateContact: payload?.immediateContact,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 [Socket.io] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

/**
 * Access the active Socket.io instance
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io has not been initialized. Call initSocket(server) first.");
  }
  return io;
}

/**
 * Emit event to a specific customer by user/customer ID
 */
export function notifyCustomer(customerId: string, event: string, payload: SocketNotificationPayload): void {
  if (!io) return;
  const idStr = customerId.toString();
  console.log(`📡 [Socket.io] Emitting '${event}' to customer:${idStr}`, payload.type);
  io.to(`customer:${idStr}`).to(`user:${idStr}`).emit(event, payload);
}

/**
 * Emit event to all connected workers
 */
export function notifyWorkers(event: string, payload: SocketNotificationPayload): void {
  if (!io) return;
  console.log(`📡 [Socket.io] Broadcasting '${event}' to 'workers' room`, payload.type);
  io.to("workers").emit(event, payload);
  io.emit(event, payload);
}

/**
 * Emit event to all connected sockets
 */
export function notifyAll(event: string, payload: SocketNotificationPayload): void {
  if (!io) return;
  io.emit(event, payload);
}
