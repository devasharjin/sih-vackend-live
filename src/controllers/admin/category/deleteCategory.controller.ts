import { Request, Response } from "express";
import mongoose from "mongoose";
import Category from "../../../models/category.model";
import Service from "../../../models/service.model";
import { fail, ok } from "../../../shared/envelope";

export async function deleteCategory(req: Request, res: Response) {
  const id = req.params.id as string;

  if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid category ID", null, 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    return fail(res, "Category not found", null, 404);
  }

  // Prevent deletion if services are attached to this category
  const linkedServicesCount = await Service.countDocuments({ category: id });
  if (linkedServicesCount > 0) {
    return fail(
      res,
      `Cannot delete category: ${linkedServicesCount} service(s) are currently associated with it`,
      null,
      400
    );
  }

  await Category.findByIdAndDelete(id);

  return ok(res, null, "Category deleted successfully");
}
