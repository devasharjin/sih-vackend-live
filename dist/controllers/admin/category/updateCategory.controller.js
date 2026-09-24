"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategory = updateCategory;
const mongoose_1 = __importDefault(require("mongoose"));
const category_model_1 = __importDefault(require("../../../models/category.model"));
const envelope_1 = require("../../../shared/envelope");
async function updateCategory(req, res) {
    const id = req.params.id;
    if (!id || typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid category ID", null, 400);
    }
    const category = await category_model_1.default.findById(id);
    if (!category) {
        return (0, envelope_1.fail)(res, "Category not found", null, 404);
    }
    const { name, icon, description, isActive } = req.body;
    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
            return (0, envelope_1.fail)(res, "Category name cannot be empty", null, 400);
        }
        const trimmedName = name.trim();
        if (trimmedName.length < 2 || trimmedName.length > 100) {
            return (0, envelope_1.fail)(res, "Category name must be between 2 and 100 characters", null, 400);
        }
        // Check if another category with the same name exists
        const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const existingCategory = await category_model_1.default.findOne({
            _id: { $ne: id },
            name: { $regex: new RegExp(`^${escapedName}$`, "i") },
        });
        if (existingCategory) {
            return (0, envelope_1.fail)(res, "Category with this name already exists", null, 409);
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
            return (0, envelope_1.fail)(res, "Description cannot exceed 500 characters", null, 400);
        }
        category.description = typeof description === "string" ? description.trim() : "";
    }
    if (isActive !== undefined) {
        category.isActive = Boolean(isActive);
    }
    await category.save();
    return (0, envelope_1.ok)(res, category, "Category updated successfully");
}
//# sourceMappingURL=updateCategory.controller.js.map