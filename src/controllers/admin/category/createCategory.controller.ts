import { Request, Response } from "express";
import Category from "../../../models/category.model";
import { fail, ok } from "../../../shared/envelope";

export async function createCategory(req: Request, res: Response) {
  const { name, icon, description, isActive } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return fail(res, "Category name is required", null, 400);
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return fail(res, "Category name must be between 2 and 100 characters", null, 400);
  }

  // Check if category with same name already exists (case-insensitive)
  const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existingCategory = await Category.findOne({
    name: { $regex: new RegExp(`^${escapedName}$`, "i") },
  });

  if (existingCategory) {
    return fail(res, "Category with this name already exists", null, 409);
  }

  if (description && description.length > 500) {
    return fail(res, "Description cannot exceed 500 characters", null, 400);
  }

  const category = await Category.create({
    name: trimmedName,
    icon: typeof icon === "string" ? icon.trim() : "",
    description: typeof description === "string" ? description.trim() : "",
    isActive: typeof isActive === "boolean" ? isActive : true,
  });

  return ok(res, category, "Category created successfully");
}
