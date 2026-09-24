"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = getCategories;
exports.getCategory = getCategory;
const mongoose_1 = __importDefault(require("mongoose"));
const category_model_1 = __importDefault(require("../../../models/category.model"));
const envelope_1 = require("../../../shared/envelope");
async function getCategories(req, res) {
    const { isActive, sortBy = "name", order = "desc" } = req.query;
    const search = (req.query.search || req.query.q);
    const filter = {};
    if (isActive !== undefined) {
        filter.isActive = isActive === "true";
    }
    if (typeof search === "string" && search.trim()) {
        const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchRegex = new RegExp(escapedSearch, "i");
        filter.$or = [
            { name: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
            { slug: { $regex: searchRegex } },
        ];
    }
    const sortDirection = order === "desc" ? -1 : 1;
    const sortField = typeof sortBy === "string" ? sortBy : "name";
    const categories = await category_model_1.default.find(filter)
        .sort({ [sortField]: sortDirection })
        .lean();
    return (0, envelope_1.ok)(res, categories, "Categories retrieved successfully");
}
async function getCategory(req, res) {
    const identifier = req.params.id;
    if (!identifier || typeof identifier !== "string") {
        return (0, envelope_1.fail)(res, "Category identifier (ID, slug, or name) is required", null, 400);
    }
    let category = null;
    if (mongoose_1.default.Types.ObjectId.isValid(identifier)) {
        category = await category_model_1.default.findById(identifier).lean();
    }
    if (!category) {
        // Also allow finding by slug or case-insensitive exact name
        category = await category_model_1.default.findOne({
            $or: [
                { slug: identifier.toLowerCase().trim() },
                { name: { $regex: new RegExp(`^${identifier.trim()}$`, "i") } },
            ],
        }).lean();
    }
    if (!category) {
        return (0, envelope_1.fail)(res, "Category not found", null, 404);
    }
    return (0, envelope_1.ok)(res, category, "Category retrieved successfully");
}
//# sourceMappingURL=getCategories.controller.js.map