"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = deleteService;
const mongoose_1 = __importDefault(require("mongoose"));
const service_model_1 = __importDefault(require("../../../models/service.model"));
const envelope_1 = require("../../../shared/envelope");
async function deleteService(req, res) {
    const id = req.params.id;
    if (!id || typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid service ID", null, 400);
    }
    const service = await service_model_1.default.findById(id);
    if (!service) {
        return (0, envelope_1.fail)(res, "Service not found", null, 404);
    }
    await service_model_1.default.findByIdAndDelete(id);
    return (0, envelope_1.ok)(res, null, "Service deleted successfully");
}
//# sourceMappingURL=deleteService.controller.js.map