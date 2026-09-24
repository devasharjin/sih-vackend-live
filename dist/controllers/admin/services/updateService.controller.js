"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateService = updateService;
const mongoose_1 = __importDefault(require("mongoose"));
const service_model_1 = __importDefault(require("../../../models/service.model"));
const category_model_1 = __importDefault(require("../../../models/category.model"));
const envelope_1 = require("../../../shared/envelope");
const billing_service_1 = require("../../../services/billing.service");
async function updateService(req, res) {
    const id = req.params.id;
    if (!id || typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid service ID", null, 400);
    }
    const service = await service_model_1.default.findById(id);
    if (!service) {
        return (0, envelope_1.fail)(res, "Service not found", null, 404);
    }
    const { name, description, category, icon, priceType, firstHourRate, additionalHourRate, cooperativeShare, insuranceShare, hourlyPrice, metersPrice, isActive, } = req.body;
    if (icon !== undefined) {
        service.icon = typeof icon === "string" ? icon.trim() : "";
    }
    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
            return (0, envelope_1.fail)(res, "Service name cannot be empty", null, 400);
        }
        const trimmedName = name.trim();
        if (trimmedName.length < 2 || trimmedName.length > 100) {
            return (0, envelope_1.fail)(res, "Service name must be between 2 and 100 characters", null, 400);
        }
        const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const existingService = await service_model_1.default.findOne({
            _id: { $ne: id },
            name: { $regex: new RegExp(`^${escapedName}$`, "i") },
        });
        if (existingService) {
            return (0, envelope_1.fail)(res, "Service with this name already exists", null, 409);
        }
        service.name = trimmedName;
    }
    if (description !== undefined) {
        if (typeof description !== "string" || !description.trim()) {
            return (0, envelope_1.fail)(res, "Service description cannot be empty", null, 400);
        }
        if (description.trim().length > 1000) {
            return (0, envelope_1.fail)(res, "Service description cannot exceed 1000 characters", null, 400);
        }
        service.description = description.trim();
    }
    if (category !== undefined) {
        if (category && typeof category === "string" && mongoose_1.default.Types.ObjectId.isValid(category)) {
            const categoryExists = await category_model_1.default.findById(category);
            if (categoryExists) {
                service.category = new mongoose_1.default.Types.ObjectId(category);
            }
        }
    }
    const effectivePriceType = priceType !== undefined ? priceType : service.priceType;
    if (priceType !== undefined) {
        if (!["hourly", "meters"].includes(priceType)) {
            return (0, envelope_1.fail)(res, "Price type must be either 'hourly' or 'meters'", null, 400);
        }
        service.priceType = priceType;
    }
    // First hour rate
    if (firstHourRate !== undefined && firstHourRate !== null) {
        const parsed = Number(firstHourRate);
        if (isNaN(parsed) || parsed < 0) {
            return (0, envelope_1.fail)(res, "First hour rate must be a non-negative number", null, 400);
        }
        service.firstHourRate = parsed;
        service.hourlyPrice = parsed;
    }
    else if (hourlyPrice !== undefined && hourlyPrice !== null) {
        const parsed = Number(hourlyPrice);
        if (isNaN(parsed) || parsed < 0) {
            return (0, envelope_1.fail)(res, "Hourly price must be a non-negative number", null, 400);
        }
        service.firstHourRate = parsed;
        service.hourlyPrice = parsed;
    }
    // Additional hour rate
    if (additionalHourRate !== undefined && additionalHourRate !== null) {
        const parsed = Number(additionalHourRate);
        if (isNaN(parsed) || parsed < 0) {
            return (0, envelope_1.fail)(res, "Additional hour rate must be a non-negative number", null, 400);
        }
        service.additionalHourRate = parsed;
    }
    // Cooperative Share
    if (cooperativeShare !== undefined && cooperativeShare !== null) {
        const parsed = Number(cooperativeShare);
        if (isNaN(parsed) || parsed < 0 || parsed > 100) {
            return (0, envelope_1.fail)(res, "Cooperative admin share must be between 0% and 100%", null, 400);
        }
        service.cooperativeShare = parsed;
    }
    // Insurance Share
    if (insuranceShare !== undefined && insuranceShare !== null) {
        const parsed = Number(insuranceShare);
        if (isNaN(parsed) || parsed < 0 || parsed > 100) {
            return (0, envelope_1.fail)(res, "Insurance share must be between 0% and 100%", null, 400);
        }
        service.insuranceShare = parsed;
    }
    // Validate combined shares
    const finalCoop = service.cooperativeShare ?? 10;
    const finalIns = service.insuranceShare ?? 5;
    if (finalCoop + finalIns > 100) {
        return (0, envelope_1.fail)(res, `Combined cooperative (${finalCoop}%) and insurance (${finalIns}%) share cannot exceed 100%`, null, 400);
    }
    // Transport fee is centrally fixed at ₹30
    service.transportFee = billing_service_1.FIXED_TRANSPORT_FEE;
    if (metersPrice !== undefined) {
        const parsedMetersPrice = Number(metersPrice);
        if (isNaN(parsedMetersPrice) || parsedMetersPrice < 0) {
            return (0, envelope_1.fail)(res, "A valid non-negative meters price is required", null, 400);
        }
        service.metersPrice = parsedMetersPrice;
    }
    if (effectivePriceType === "hourly" && (service.firstHourRate === undefined || service.firstHourRate === null)) {
        return (0, envelope_1.fail)(res, "First hour rate is required when price type is hourly", null, 400);
    }
    if (effectivePriceType === "meters" && (service.metersPrice === undefined || service.metersPrice === null)) {
        return (0, envelope_1.fail)(res, "Meters price is required when price type is meters", null, 400);
    }
    if (isActive !== undefined) {
        service.isActive = Boolean(isActive);
    }
    try {
        await service.save();
        await service.populate("category", "name slug icon isActive");
        return (0, envelope_1.ok)(res, service, "Service updated successfully");
    }
    catch (err) {
        if (err?.code === 11000) {
            return (0, envelope_1.fail)(res, "Service with this name already exists in this category", null, 409);
        }
        if (err?.name === "ValidationError") {
            const message = Object.values(err.errors || {})
                .map((e) => e.message)
                .join(", ");
            return (0, envelope_1.fail)(res, message || "Service validation failed", null, 400);
        }
        throw err;
    }
}
//# sourceMappingURL=updateService.controller.js.map