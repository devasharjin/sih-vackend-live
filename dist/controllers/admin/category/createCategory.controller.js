"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = createCategory;
const category_model_1 = __importDefault(require("../../../models/category.model"));
const envelope_1 = require("../../../shared/envelope");
async function createCategory(req, res) {
    const { name, icon, description, isActive } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
        return (0, envelope_1.fail)(res, "Category name is required", null, 400);
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
        return (0, envelope_1.fail)(res, "Category name must be between 2 and 100 characters", null, 400);
    }
    // Check if category with same name already exists (case-insensitive)
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existingCategory = await category_model_1.default.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, "i") },
    });
    if (existingCategory) {
        return (0, envelope_1.fail)(res, "Category with this name already exists", null, 409);
    }
    if (description && description.length > 500) {
        return (0, envelope_1.fail)(res, "Description cannot exceed 500 characters", null, 400);
    }
    const category = await category_model_1.default.create({
        name: trimmedName,
        icon: typeof icon === "string" ? icon.trim() : "",
        description: typeof description === "string" ? description.trim() : "",
        isActive: typeof isActive === "boolean" ? isActive : true,
    });
    return (0, envelope_1.ok)(res, category, "Category created successfully");
}
//# sourceMappingURL=createCategory.controller.js.map