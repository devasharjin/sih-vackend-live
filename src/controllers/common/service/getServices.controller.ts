import { Request, Response } from "express";
import mongoose from "mongoose";
import Service from "../../../models/service.model";
import { fail, ok } from "../../../shared/envelope";

export async function getServices(req: Request, res: Response) {
  const { isActive, category, priceType, sortBy = "createdAt", order = "asc" } = req.query;
  const search = (req.query.search || req.query.q) as string | undefined;

  const filter: Record<string, any> = {};

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  if (category && typeof category === "string" && mongoose.Types.ObjectId.isValid(category)) {
    filter.category = category;
  }

  if (priceType && typeof priceType === "string") {
    filter.priceType = priceType;
  }

  if (typeof search === "string" && search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");

    filter.$or = [
      { name: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
    ];
  }

  const sortDirection = order === "desc" ? -1 : 1;
  const sortField = typeof sortBy === "string" ? sortBy : "createdAt";

  const services = await Service.find(filter)
    .populate("category", "name slug icon isActive")
    .sort({ [sortField]: sortDirection })
    .lean();

  return ok(res, services, "Services retrieved successfully");
}

export async function getServiceById(req: Request, res: Response) {
  const id = req.params.id as string;

  if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid service ID", null, 400);
  }

  const service = await Service.findById(id)
    .populate("category", "name slug icon isActive")
    .lean();

  if (!service) {
    return fail(res, "Service not found", null, 404);
  }

  return ok(res, service, "Service retrieved successfully");
}
