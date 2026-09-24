"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCooperativeForecastOverview = getCooperativeForecastOverview;
exports.getCategoryDemandBreakdown = getCategoryDemandBreakdown;
exports.getZoneAllocationMatrix = getZoneAllocationMatrix;
exports.getRebalancePlans = getRebalancePlans;
exports.executeRebalancePlan = executeRebalancePlan;
exports.getFairRotationMetrics = getFairRotationMetrics;
const mongoose_1 = __importDefault(require("mongoose"));
const cooperative_model_1 = __importDefault(require("../../models/auth/cooperative.model"));
const forecasting_service_1 = require("../../services/forecasting.service");
const envelope_1 = require("../../shared/envelope");
/**
 * Get 7-day demand forecast and 24-hour peak curve for the cooperative
 */
async function getCooperativeForecastOverview(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    const overview = await forecasting_service_1.ForecastingService.getCooperativeForecastOverview(cooperative._id);
    return (0, envelope_1.ok)(res, {
        ...overview,
        cooperative: {
            id: cooperative._id,
            name: cooperative.cooperativeName,
        },
    }, "Forecasting overview retrieved successfully");
}
/**
 * Get category and trade demand distribution
 */
async function getCategoryDemandBreakdown(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    const breakdown = await forecasting_service_1.ForecastingService.getCategoryDemandBreakdown(cooperative._id);
    return (0, envelope_1.ok)(res, breakdown, "Category demand breakdown retrieved successfully");
}
/**
 * Get zone-by-zone allocation matrix with capacity and deficit/surplus gaps
 */
async function getZoneAllocationMatrix(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    const matrix = await forecasting_service_1.ForecastingService.getZoneAllocationMatrix(cooperative._id);
    return (0, envelope_1.ok)(res, matrix, "Zone allocation matrix retrieved successfully");
}
/**
 * Get AI-recommended workforce rebalancing plans
 */
async function getRebalancePlans(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    const plans = await forecasting_service_1.ForecastingService.getRebalanceRecommendations(cooperative._id);
    return (0, envelope_1.ok)(res, plans, "Rebalancing recommendations retrieved successfully");
}
/**
 * Execute or approve a workforce rebalance plan
 */
async function executeRebalancePlan(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!paramId || typeof paramId !== "string" || !mongoose_1.default.Types.ObjectId.isValid(paramId)) {
        return (0, envelope_1.fail)(res, "Invalid plan ID", null, 400);
    }
    const userId = req.user.userId || req.user?.id;
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    try {
        const executedPlan = await forecasting_service_1.ForecastingService.executeRebalancePlan(paramId, cooperative._id, new mongoose_1.default.Types.ObjectId(userId));
        return (0, envelope_1.ok)(res, executedPlan, "Rebalance plan executed successfully");
    }
    catch (error) {
        return (0, envelope_1.fail)(res, error.message || "Failed to execute plan", null, 400);
    }
}
/**
 * Get cooperative fair rotation metrics & gig distribution equity score
 */
async function getFairRotationMetrics(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found", null, 404);
    }
    const metrics = await forecasting_service_1.ForecastingService.getFairRotationMetrics(cooperative._id);
    return (0, envelope_1.ok)(res, metrics, "Fair rotation metrics retrieved successfully");
}
//# sourceMappingURL=forecasting.controller.js.map