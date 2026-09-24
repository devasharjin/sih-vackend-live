"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_service_1 = require("./services/socket.service");
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const dns_1 = __importDefault(require("dns"));
const auth_routes_1 = __importDefault(require("./routes/auth/auth.routes"));
const category_routes_1 = __importDefault(require("./routes/admin/category.routes"));
const service_routes_1 = __importDefault(require("./routes/admin/service.routes"));
const category_routes_2 = __importDefault(require("./routes/customer/category.routes"));
const booking_routes_1 = __importDefault(require("./routes/customer/booking.routes"));
const payment_routes_1 = __importDefault(require("./routes/customer/payment.routes"));
const profile_routes_1 = __importDefault(require("./routes/customer/profile.routes"));
const contact_routes_1 = __importDefault(require("./routes/customer/contact.routes"));
const voiceAssistant_routes_1 = __importDefault(require("./routes/customer/voiceAssistant.routes"));
const gig_routes_1 = __importDefault(require("./routes/worker/gig.routes"));
const workerVerification_routes_1 = __importDefault(require("./routes/cooperative/workerVerification.routes"));
const verification_routes_1 = __importDefault(require("./routes/admin/verification.routes"));
const payment_routes_2 = __importDefault(require("./routes/admin/payment.routes"));
const payment_routes_3 = __importDefault(require("./routes/cooperative/payment.routes"));
const welfare_routes_1 = __importDefault(require("./routes/worker/welfare.routes"));
const welfare_routes_2 = __importDefault(require("./routes/cooperative/welfare.routes"));
const welfare_routes_3 = __importDefault(require("./routes/admin/welfare.routes"));
const forecasting_routes_1 = __importDefault(require("./routes/cooperative/forecasting.routes"));
const overview_routes_1 = __importDefault(require("./routes/cooperative/overview.routes"));
const members_routes_1 = __importDefault(require("./routes/cooperative/members.routes"));
const forecasting_routes_2 = __importDefault(require("./routes/admin/forecasting.routes"));
const overview_routes_2 = __importDefault(require("./routes/admin/overview.routes"));
const user_routes_1 = __importDefault(require("./routes/admin/user.routes"));
const forecasting_routes_3 = __importDefault(require("./routes/worker/forecasting.routes"));
const notFound_1 = require("./middleware/notFound");
const errorHandler_1 = require("./middleware/errorHandler");
// Only override DNS in local development (Vercel Lambda manages its own DNS resolution)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    try {
        dns_1.default.setServers(["8.8.8.8", "8.8.4.4"]);
        dns_1.default.setDefaultResultOrder("ipv4first");
    }
    catch (err) {
        console.warn("DNS override skipped:", err);
    }
}
dotenv_1.default.config({ quiet: true });
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;
// CORS configuration (enabling cookies and credentials across origins)
const allowedOrigins = [
    process.env.CLIENT_URL,
    "https://fairgigs-f2l1-jet.vercel.app",
    "https://fairgigs.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5000",
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, server-to-server, Postman)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Allow any vercel preview deployment or subdomains
        if (/^https:\/\/fairgigs-[a-z0-9-]+\.vercel\.app$/.test(origin) ||
            /^https:\/\/.*\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }
        // Allow localhost on any port in development
        if (/^http:\/\/localhost:[0-9]+$/.test(origin)) {
            return callback(null, true);
        }
        callback(null, false);
    },
    credentials: true,
    exposedHeaders: ["Set-Cookie", "Authorization", "x-refresh-token"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-refresh-token",
        "X-Requested-With",
        "Accept",
    ],
}));
// Standard Core Middlewares
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "2mb" }));
app.use((0, morgan_1.default)('dev'));
// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Cooperative Gig Services API is running',
        timestamp: new Date().toISOString()
    });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/admin/overview', overview_routes_2.default);
app.use('/api/admin/users', user_routes_1.default);
app.use('/api/admin/categories', category_routes_1.default);
app.use('/api/admin/services', service_routes_1.default);
app.use('/api/admin/verifications', verification_routes_1.default);
app.use('/api/admin/payments', payment_routes_2.default);
app.use('/api/admin/welfare', welfare_routes_3.default);
app.use('/api/admin/forecasting', forecasting_routes_2.default);
app.use('/api/customer', category_routes_2.default);
app.use('/api/customer/bookings', booking_routes_1.default);
app.use('/api/customer/payments', payment_routes_1.default);
app.use('/api/customer/profile', profile_routes_1.default);
app.use('/api/customer/contact', contact_routes_1.default);
app.use('/api/voice-assistant', voiceAssistant_routes_1.default);
app.use('/api/customer/voice-assistant', voiceAssistant_routes_1.default);
app.use('/api/worker/gigs', gig_routes_1.default);
app.use('/api/worker/welfare', welfare_routes_1.default);
app.use('/api/worker/forecasting', forecasting_routes_3.default);
app.use('/api/cooperative', workerVerification_routes_1.default);
app.use('/api/cooperative/overview', overview_routes_1.default);
app.use('/api/cooperative/members', members_routes_1.default);
app.use('/api/cooperative/payments', payment_routes_3.default);
app.use('/api/cooperative/welfare', welfare_routes_2.default);
app.use('/api/cooperative/forecasting', forecasting_routes_1.default);
// Error Middlewares (must be registered after routes)
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
// Create HTTP server and attach Socket.io
const server = http_1.default.createServer(app);
const io = (0, socket_service_1.initSocket)(server);
// Start server
const startServer = async () => {
    try {
        await (0, database_1.connectDB)();
    }
    catch (error) {
        console.error('Failed to start server:', error);
    }
};
startServer();
// Start listening if running locally or in standalone container (not on Vercel)
if (!process.env.VERCEL) {
    server.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map