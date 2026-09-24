"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkerDemandHotspots = getWorkerDemandHotspots;
exports.getWorkerSmartShifts = getWorkerSmartShifts;
const worker_model_1 = __importDefault(require("../../models/auth/worker.model"));
const forecasting_service_1 = require("../../services/forecasting.service");
const envelope_1 = require("../../shared/envelope");
/**
 * Get AI demand surge hotspots and active zone multipliers for workers
 */
async function getWorkerDemandHotspots(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const hotspots = await forecasting_service_1.ForecastingService.getWorkerHotspots();
    return (0, envelope_1.ok)(res, hotspots, "AI demand hotspots retrieved successfully");
}
/**
 * Get AI personalized smart shift recommendation for the logged in worker
 */
async function getWorkerSmartShifts(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const worker = await worker_model_1.default.findOne({ userId });
    if (!worker) {
        return (0, envelope_1.fail)(res, "Worker profile not found", null, 404);
    }
    const smartShifts = await forecasting_service_1.ForecastingService.getWorkerSmartShifts(worker._id);
    return (0, envelope_1.ok)(res, smartShifts, "Smart shift recommendation retrieved successfully");
}
//# sourceMappingURL=forecasting.controller.js.map