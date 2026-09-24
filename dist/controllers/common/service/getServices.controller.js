"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServices = getServices;
exports.getServiceById = getServiceById;
const mongoose_1 = __importDefault(require("mongoose"));
const service_model_1 = __importDefault(require("../../../models/service.model"));
const envelope_1 = require("../../../shared/envelope");
async function getServices(req, res) {
    const { isActive, category, priceType, sortBy = "createdAt", order = "asc" } = req.query;
    const search = (req.query.search || req.query.q);
    const filter = {};
    if (isActive !== undefined) {
        filter.isActive = isActive === "true";
    }
    if (category && typeof category === "string" && mongoose_1.default.Types.ObjectId.isValid(category)) {
        filter.category = category;
    }
    if (priceType && typeof priceType === "string") {
        filter.priceType = priceType;
    }
    if (typeof search === "string" && search.trim()) {
        const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchRegex = new RegExp(escapedSearch, "i");
        filter.$or = [
            { name: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
        ];
    }
    const sortDirection = order === "desc" ? -1 : 1;
    const sortField = typeof sortBy === "string" ? sortBy : "createdAt";
    const services = await service_model_1.default.find(filter)
        .populate("category", "name slug icon isActive")
        .sort({ [sortField]: sortDirection })
        .lean();
    return (0, envelope_1.ok)(res, services, "Services retrieved successfully");
}
async function getServiceById(req, res) {
    const id = req.params.id;
    if (!id || typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid service ID", null, 400);
    }
    const service = await service_model_1.default.findById(id)
        .populate("category", "name slug icon isActive")
        .lean();
    if (!service) {
        return (0, envelope_1.fail)(res, "Service not found", null, 404);
    }
    return (0, envelope_1.ok)(res, service, "Service retrieved successfully");
}
//# sourceMappingURL=getServices.controller.js.map