import { Request, Response } from "express";
import mongoose from "mongoose";
import Service from "../../../models/service.model";
import { fail, ok } from "../../../shared/envelope";

export async function deleteService(req: Request, res: Response) {
  const id = req.params.id as string;

  if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid service ID", null, 400);
  }

  const service = await Service.findById(id);
  if (!service) {
    return fail(res, "Service not found", null, 404);
  }

  await Service.findByIdAndDelete(id);

  return ok(res, null, "Service deleted successfully");
}
