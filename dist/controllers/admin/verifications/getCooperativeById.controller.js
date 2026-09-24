"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminCooperativeById = getAdminCooperativeById;
const mongoose_1 = __importDefault(require("mongoose"));
const cooperative_model_1 = __importDefault(require("../../../models/auth/cooperative.model"));
const envelope_1 = require("../../../shared/envelope");
/**
 * Get single cooperative details for admin review
 */
async function getAdminCooperativeById(req, res) {
    const id = String(req.params.id);
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid cooperative ID", null, 400);
    }
    const cooperative = await cooperative_model_1.default.findById(id)
        .populate("userId", "name email phone profilePicture accountStatus createdAt")
        .lean();
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative not found", null, 404);
    }
    return (0, envelope_1.ok)(res, cooperative, "Cooperative details retrieved successfully");
}
//# sourceMappingURL=getCooperativeById.controller.js.map