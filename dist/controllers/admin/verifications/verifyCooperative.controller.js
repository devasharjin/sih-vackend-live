"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdminCooperative = verifyAdminCooperative;
const mongoose_1 = __importDefault(require("mongoose"));
const cooperative_model_1 = __importDefault(require("../../../models/auth/cooperative.model"));
const worker_model_1 = require("../../../models/auth/worker.model");
const envelope_1 = require("../../../shared/envelope");
/**
 * Approve, reject, or reset a cooperative registration
 */
async function verifyAdminCooperative(req, res) {
    const id = String(req.params.id);
    const { action, rejectionReason } = req.body;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid cooperative ID", null, 400);
    }
    if (action !== "APPROVE" && action !== "REJECT" && action !== "PENDING") {
        return (0, envelope_1.fail)(res, "Invalid action. Action must be 'APPROVE', 'REJECT', or 'PENDING'", null, 400);
    }
    const cooperative = await cooperative_model_1.default.findById(id);
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative not found", null, 404);
    }
    if (action === "APPROVE") {
        cooperative.verificationStatus = worker_model_1.VerificationStatus.APPROVED;
        cooperative.rejectedReason = undefined;
        await cooperative.save();
        const populated = await cooperative_model_1.default.findById(cooperative._id).populate("userId", "name email phone profilePicture accountStatus createdAt");
        return (0, envelope_1.ok)(res, populated, `Cooperative "${cooperative.cooperativeName}" has been successfully approved.`);
    }
    else if (action === "REJECT") {
        const reason = rejectionReason?.trim() ||
            "Verification documents or society credentials did not meet compliance requirements.";
        cooperative.verificationStatus = worker_model_1.VerificationStatus.REJECTED;
        cooperative.rejectedReason = reason;
        await cooperative.save();
        const populated = await cooperative_model_1.default.findById(cooperative._id).populate("userId", "name email phone profilePicture accountStatus createdAt");
        return (0, envelope_1.ok)(res, populated, `Cooperative "${cooperative.cooperativeName}" registration has been rejected.`);
    }
    else {
        // Revert to PENDING
        cooperative.verificationStatus = worker_model_1.VerificationStatus.PENDING;
        cooperative.rejectedReason = undefined;
        await cooperative.save();
        const populated = await cooperative_model_1.default.findById(cooperative._id).populate("userId", "name email phone profilePicture accountStatus createdAt");
        return (0, envelope_1.ok)(res, populated, `Cooperative "${cooperative.cooperativeName}" status reverted to pending.`);
    }
}
//# sourceMappingURL=verifyCooperative.controller.js.map