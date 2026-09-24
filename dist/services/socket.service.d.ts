import http from "http";
import { Server as SocketIOServer } from "socket.io";
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
export declare function initSocket(server: http.Server): SocketIOServer;
/**
 * Access the active Socket.io instance
 */
export declare function getIO(): SocketIOServer;
/**
 * Emit event to a specific customer by user/customer ID
 */
export declare function notifyCustomer(customerId: string, event: string, payload: SocketNotificationPayload): void;
/**
 * Emit event to all connected workers
 */
export declare function notifyWorkers(event: string, payload: SocketNotificationPayload): void;
/**
 * Emit event to all connected sockets
 */
export declare function notifyAll(event: string, payload: SocketNotificationPayload): void;
//# sourceMappingURL=socket.service.d.ts.map