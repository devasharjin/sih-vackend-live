import { Request, Response } from "express";
import Cooperative from "../../models/auth/cooperative.model";
import { ok } from "../../shared/envelope";

export const getCooperatives = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const cooperatives = await Cooperative.find(
    {},
    "_id cooperativeName cooperativeAddress cooperativePhone services verificationStatus"
  ).sort({ cooperativeName: 1 });

  return ok(res, cooperatives, "Cooperatives retrieved successfully");
};
