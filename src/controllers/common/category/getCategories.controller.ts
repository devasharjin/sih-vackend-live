import { Request, Response } from "express";
import mongoose from "mongoose";
import Category from "../../../models/category.model";
import { fail, ok } from "../../../shared/envelope";

export async function getCategories(req: Request, res: Response) {
  const { isActive, sortBy = "name", order = "desc" } = req.query;
  const search = (req.query.search || req.query.q) as string | undefined;

  const filter: Record<string, any> = {};

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  if (typeof search === "string" && search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");

    filter.$or = [
      { name: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
      { slug: { $regex: searchRegex } },
    ];
  }

  const sortDirection = order === "desc" ? -1 : 1;
  const sortField = typeof sortBy === "string" ? sortBy : "name";

  const categories = await Category.find(filter)
    .sort({ [sortField]: sortDirection })
    .lean();

  return ok(res, categories, "Categories retrieved successfully");
}

export async function getCategory(req: Request, res: Response) {
  const identifier = req.params.id as string;

  if (!identifier || typeof identifier !== "string") {
    return fail(res, "Category identifier (ID, slug, or name) is required", null, 400);
  }

  let category = null;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    category = await Category.findById(identifier).lean();
  }

  if (!category) {
    // Also allow finding by slug or case-insensitive exact name
    category = await Category.findOne({
      $or: [
        { slug: identifier.toLowerCase().trim() },
        { name: { $regex: new RegExp(`^${identifier.trim()}$`, "i") } },
      ],
    }).lean();
  }

  if (!category) {
    return fail(res, "Category not found", null, 404);
  }

  return ok(res, category, "Category retrieved successfully");
}
