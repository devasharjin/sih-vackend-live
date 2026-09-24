"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    // If already connected or connecting, reuse existing connection
    if (mongoose_1.default.connection.readyState >= 1) {
        return;
    }
    const URI = process.env.MONGODB_URI;
    if (!URI) {
        console.warn('⚠️ MONGODB_URI is not set in environment variables');
        return;
    }
    try {
        await mongoose_1.default.connect(URI, {
            maxPoolSize: 10,
            minPoolSize: 1,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
        });
        console.log('MongoDB connected successfully');
    }
    catch (error) {
        console.error('MongoDB connection failed:', error);
        // Never crash the process in production/serverless environments (allows health checks and error responses)
        if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.disconnect();
        console.log('MongoDB disconnected');
    }
    catch (error) {
        console.error('MongoDB disconnection error:', error);
        throw error;
    }
};
exports.disconnectDB = disconnectDB;
//# sourceMappingURL=database.js.map