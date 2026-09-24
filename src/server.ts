import express, { Express, Request, Response } from 'express';
import http from 'http';
import { initSocket } from './services/socket.service';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import dns from 'dns';
import authRoutes from './routes/auth/auth.routes';
import adminCategoryRoutes from './routes/admin/category.routes';
import adminServiceRoutes from './routes/admin/service.routes';
import customerCategoryRoutes from './routes/customer/category.routes';
import customerBookingRoutes from './routes/customer/booking.routes';
import customerPaymentRoutes from './routes/customer/payment.routes';
import customerProfileRoutes from './routes/customer/profile.routes';
import customerContactRoutes from './routes/customer/contact.routes';
import voiceAssistantRoutes from './routes/customer/voiceAssistant.routes';
import workerGigRoutes from './routes/worker/gig.routes';
import cooperativeRoutes from './routes/cooperative/workerVerification.routes';
import adminVerificationRoutes from './routes/admin/verification.routes';
import adminPaymentRoutes from './routes/admin/payment.routes';
import cooperativePaymentRoutes from './routes/cooperative/payment.routes';
import workerWelfareRoutes from './routes/worker/welfare.routes';
import cooperativeWelfareRoutes from './routes/cooperative/welfare.routes';
import adminWelfareRoutes from './routes/admin/welfare.routes';
import cooperativeForecastingRoutes from './routes/cooperative/forecasting.routes';
import cooperativeOverviewRoutes from './routes/cooperative/overview.routes';
import cooperativeMemberRoutes from './routes/cooperative/members.routes';
import adminForecastingRoutes from './routes/admin/forecasting.routes';
import adminOverviewRoutes from './routes/admin/overview.routes';
import adminUserRoutes from './routes/admin/user.routes';
import workerForecastingRoutes from './routes/worker/forecasting.routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

// Only override DNS in local development (Vercel Lambda manages its own DNS resolution)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
    dns.setDefaultResultOrder("ipv4first");
  } catch (err) {
    console.warn("DNS override skipped:", err);
  }
}

dotenv.config({ quiet: true });

const app: Express = express();
const PORT = process.env.PORT || 5000;

// CORS configuration (enabling cookies and credentials)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://devasharjin.github.io/fairgigs",
    credentials: true,
  })
);

// Standard Core Middlewares
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(morgan('dev'));

// Basic health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Cooperative Gig Services API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/overview', adminOverviewRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/services', adminServiceRoutes);
app.use('/api/admin/verifications', adminVerificationRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/admin/welfare', adminWelfareRoutes);
app.use('/api/admin/forecasting', adminForecastingRoutes);
app.use('/api/customer', customerCategoryRoutes);
app.use('/api/customer/bookings', customerBookingRoutes);
app.use('/api/customer/payments', customerPaymentRoutes);
app.use('/api/customer/profile', customerProfileRoutes);
app.use('/api/customer/contact', customerContactRoutes);
app.use('/api/voice-assistant', voiceAssistantRoutes);
app.use('/api/customer/voice-assistant', voiceAssistantRoutes);
app.use('/api/worker/gigs', workerGigRoutes);
app.use('/api/worker/welfare', workerWelfareRoutes);
app.use('/api/worker/forecasting', workerForecastingRoutes);
app.use('/api/cooperative', cooperativeRoutes);
app.use('/api/cooperative/overview', cooperativeOverviewRoutes);
app.use('/api/cooperative/members', cooperativeMemberRoutes);
app.use('/api/cooperative/payments', cooperativePaymentRoutes);
app.use('/api/cooperative/welfare', cooperativeWelfareRoutes);
app.use('/api/cooperative/forecasting', cooperativeForecastingRoutes);

// Error Middlewares (must be registered after routes)
app.use(notFound);
app.use(errorHandler);

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = initSocket(server);

// Start server
const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();

// Start listening if running locally or in standalone container (not on Vercel)
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel serverless function compatibility
module.exports = app;
export default app;
