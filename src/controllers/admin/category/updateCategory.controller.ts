import { Request, Response } from "express";
import mongoose from "mongoose";
import Category from "../../../models/category.model";
import { fail, ok } from "../../../shared/envelope";

export async function updateCategory(req: Request, res: Response) {
  const id = req.params.id as string;

  if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid category ID", null, 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    return fail(res, "Category not found", null, 404);
  }

  const { name, icon, description, isActive } = req.body;

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return fail(res, "Category name cannot be empty", null, 400);
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return fail(res, "Category name must be between 2 and 100 characters", null, 400);
    }

    // Check if another category with the same name exists
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existingCategory = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
    });

    if (existingCategory) {
      return fail(res, "Category with this name already exists", null, 409);
    }

    category.name = trimmedName;
    // Update slug to reflect new name
    category.slug = trimmedName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  if (icon !== undefined) {
    category.icon = typeof icon === "string" ? icon.trim() : "";
  }

  if (description !== undefined) {
    if (typeof description === "string" && description.length > 500) {
      return fail(res, "Description cannot exceed 500 characters", null, 400);
    }
    category.description = typeof description === "string" ? description.trim() : "";
  }

  if (isActive !== undefined) {
    category.isActive = Boolean(isActive);
  }

  await category.save();

  return ok(res, category, "Category updated successfully");
}
