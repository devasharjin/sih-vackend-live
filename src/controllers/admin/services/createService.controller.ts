import { Request, Response } from "express";
import mongoose from "mongoose";
import Service from "../../../models/service.model";
import Category from "../../../models/category.model";
import { fail, ok } from "../../../shared/envelope";
import { FIXED_TRANSPORT_FEE } from "../../../services/billing.service";

export async function createService(req: Request, res: Response) {
  const {
    name,
    description,
    category,
    icon,
    priceType = "hourly",
    firstHourRate,
    additionalHourRate,
    cooperativeShare = 10,
    insuranceShare = 5,
    hourlyPrice,
    metersPrice,
    isActive,
  } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return fail(res, "Service name is required", null, 400);
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return fail(res, "Service name must be between 2 and 100 characters", null, 400);
  }

  if (!description || typeof description !== "string" || !description.trim()) {
    return fail(res, "Service description is required", null, 400);
  }

  if (description.trim().length > 1000) {
    return fail(res, "Service description cannot exceed 1000 characters", null, 400);
  }

  let validCategoryId: mongoose.Types.ObjectId | undefined;
  if (category && typeof category === "string" && mongoose.Types.ObjectId.isValid(category)) {
    const categoryExists = await Category.findById(category);
    if (categoryExists) {
      validCategoryId = categoryExists._id as mongoose.Types.ObjectId;
    }
  }

  if (!priceType || !["hourly", "meters"].includes(priceType)) {
    return fail(res, "Price type must be either 'hourly' or 'meters'", null, 400);
  }

  // Resolve firstHourRate and additionalHourRate
  let resolvedFirstHourRate: number | undefined;
  let resolvedAdditionalHourRate: number | undefined;

  if (firstHourRate !== undefined && firstHourRate !== null) {
    const parsed = Number(firstHourRate);
    if (isNaN(parsed) || parsed < 0) {
      return fail(res, "First hour rate must be a non-negative number", null, 400);
    }
    resolvedFirstHourRate = parsed;
  } else if (hourlyPrice !== undefined && hourlyPrice !== null) {
    const parsed = Number(hourlyPrice);
    if (isNaN(parsed) || parsed < 0) {
      return fail(res, "Hourly price must be a non-negative number", null, 400);
    }
    resolvedFirstHourRate = parsed;
  }

  if (additionalHourRate !== undefined && additionalHourRate !== null) {
    const parsed = Number(additionalHourRate);
    if (isNaN(parsed) || parsed < 0) {
      return fail(res, "Additional hour rate must be a non-negative number", null, 400);
    }
    resolvedAdditionalHourRate = parsed;
  } else {
    resolvedAdditionalHourRate = resolvedFirstHourRate;
  }

  if (priceType === "hourly" && resolvedFirstHourRate === undefined) {
    return fail(res, "A valid first hour rate is required for hourly services", null, 400);
  }

  const parsedMetersPrice =
    metersPrice !== undefined && metersPrice !== null ? Number(metersPrice) : undefined;
  if (priceType === "meters") {
    if (parsedMetersPrice === undefined || isNaN(parsedMetersPrice) || parsedMetersPrice < 0) {
      return fail(res, "A valid non-negative meters price is required", null, 400);
    }
  }

  // Cooperative and Insurance Share validation
  const parsedCoopShare = Number(cooperativeShare ?? 10);
  const parsedInsShare = Number(insuranceShare ?? 5);

  if (isNaN(parsedCoopShare) || parsedCoopShare < 0 || parsedCoopShare > 100) {
    return fail(res, "Cooperative admin share must be between 0% and 100%", null, 400);
  }

  if (isNaN(parsedInsShare) || parsedInsShare < 0 || parsedInsShare > 100) {
    return fail(res, "Insurance share must be between 0% and 100%", null, 400);
  }

  if (parsedCoopShare + parsedInsShare > 100) {
    return fail(
      res,
      `Combined cooperative (${parsedCoopShare}%) and insurance (${parsedInsShare}%) share cannot exceed 100%`,
      null,
      400
    );
  }

  // Check for duplicate service name (case-insensitive)
  const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existingService = await Service.findOne({
    name: { $regex: new RegExp(`^${escapedName}$`, "i") },
  });

  if (existingService) {
    return fail(res, "A service with this name already exists", null, 409);
  }

  try {
    const newService = await Service.create({
      name: trimmedName,
      description: description.trim(),
      category: validCategoryId,
      icon: icon ? String(icon).trim() : "",
      priceType,
      firstHourRate: resolvedFirstHourRate ?? 0,
      additionalHourRate: resolvedAdditionalHourRate ?? resolvedFirstHourRate ?? 0,
      transportFee: FIXED_TRANSPORT_FEE,
      cooperativeShare: parsedCoopShare,
      insuranceShare: parsedInsShare,
      hourlyPrice: resolvedFirstHourRate,
      metersPrice: priceType === "meters" ? parsedMetersPrice : undefined,
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    await newService.populate("category", "name slug icon isActive");

    return ok(res, newService, "Service created successfully");
  } catch (err: any) {
    if (err?.code === 11000) {
      return fail(res, "Service with this name already exists in this category", null, 409);
    }
    if (err?.name === "ValidationError") {
      const message = Object.values(err.errors || {})
        .map((e: any) => e.message)
        .join(", ");
      return fail(res, message || "Service validation failed", null, 400);
    }
    throw err;
  }
}

