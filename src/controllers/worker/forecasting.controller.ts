import { Request, Response } from "express";
import mongoose from "mongoose";
import Worker from "../../models/auth/worker.model";
import { ForecastingService } from "../../services/forecasting.service";
import { fail, ok } from "../../shared/envelope";

/**
 * Get AI demand surge hotspots and active zone multipliers for workers
 */
export async function getWorkerDemandHotspots(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const hotspots = await ForecastingService.getWorkerHotspots();
  return ok(res, hotspots, "AI demand hotspots retrieved successfully");
}

/**
 * Get AI personalized smart shift recommendation for the logged in worker
 */
export async function getWorkerSmartShifts(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;
  const worker = await Worker.findOne({ userId });

  if (!worker) {
    return fail(res, "Worker profile not found", null, 404);
  }

  const smartShifts = await ForecastingService.getWorkerSmartShifts(
    worker._id as mongoose.Types.ObjectId
  );

  return ok(res, smartShifts, "Smart shift recommendation retrieved successfully");
}
