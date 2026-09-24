import { Request, Response } from "express";
import mongoose from "mongoose";
import Cooperative from "../../models/auth/cooperative.model";
import { ForecastingService } from "../../services/forecasting.service";
import { fail, ok } from "../../shared/envelope";

/**
 * Get 7-day demand forecast and 24-hour peak curve for the cooperative
 */
export async function getCooperativeForecastOverview(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const cooperative = await Cooperative.findOne({ userId });

  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  const overview = await ForecastingService.getCooperativeForecastOverview(
    cooperative._id as mongoose.Types.ObjectId
  );

  return ok(
    res,
    {
      ...overview,
      cooperative: {
        id: cooperative._id,
        name: cooperative.cooperativeName,
      },
    },
    "Forecasting overview retrieved successfully"
  );
}

/**
 * Get category and trade demand distribution
 */
export async function getCategoryDemandBreakdown(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const cooperative = await Cooperative.findOne({ userId });

  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  const breakdown = await ForecastingService.getCategoryDemandBreakdown(
    cooperative._id as mongoose.Types.ObjectId
  );

  return ok(res, breakdown, "Category demand breakdown retrieved successfully");
}

/**
 * Get zone-by-zone allocation matrix with capacity and deficit/surplus gaps
 */
export async function getZoneAllocationMatrix(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const cooperative = await Cooperative.findOne({ userId });

  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  const matrix = await ForecastingService.getZoneAllocationMatrix(
    cooperative._id as mongoose.Types.ObjectId
  );

  return ok(res, matrix, "Zone allocation matrix retrieved successfully");
}

/**
 * Get AI-recommended workforce rebalancing plans
 */
export async function getRebalancePlans(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const cooperative = await Cooperative.findOne({ userId });

  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  const plans = await ForecastingService.getRebalanceRecommendations(
    cooperative._id as mongoose.Types.ObjectId
  );

  return ok(res, plans, "Rebalancing recommendations retrieved successfully");
}

/**
 * Execute or approve a workforce rebalance plan
 */
export async function executeRebalancePlan(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!paramId || typeof paramId !== "string" || !mongoose.Types.ObjectId.isValid(paramId)) {
    return fail(res, "Invalid plan ID", null, 400);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const cooperative = await Cooperative.findOne({ userId });

  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  try {
    const executedPlan = await ForecastingService.executeRebalancePlan(
      paramId,
      cooperative._id as mongoose.Types.ObjectId,
      new mongoose.Types.ObjectId(userId)
    );

    return ok(res, executedPlan, "Rebalance plan executed successfully");
  } catch (error: any) {
    return fail(res, error.message || "Failed to execute plan", null, 400);
  }
}

/**
 * Get cooperative fair rotation metrics & gig distribution equity score
 */
export async function getFairRotationMetrics(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const cooperative = await Cooperative.findOne({ userId });

  if (!cooperative) {
    return fail(res, "Cooperative profile not found", null, 404);
  }

  const metrics = await ForecastingService.getFairRotationMetrics(
    cooperative._id as mongoose.Types.ObjectId
  );

  return ok(res, metrics, "Fair rotation metrics retrieved successfully");
}
