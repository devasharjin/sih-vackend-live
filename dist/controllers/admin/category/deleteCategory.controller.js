"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = deleteCategory;
const mongoose_1 = __importDefault(require("mongoose"));
const category_model_1 = __importDefault(require("../../../models/category.model"));
const service_model_1 = __importDefault(require("../../../models/service.model"));
const envelope_1 = require("../../../shared/envelope");
async function deleteCategory(req, res) {
    const id = req.params.id;
    if (!id || typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid category ID", null, 400);
    }
    const category = await category_model_1.default.findById(id);
    if (!category) {
        return (0, envelope_1.fail)(res, "Category not found", null, 404);
    }
    // Prevent deletion if services are attached to this category
    const linkedServicesCount = await service_model_1.default.countDocuments({ category: id });
    if (linkedServicesCount > 0) {
        return (0, envelope_1.fail)(res, `Cannot delete category: ${linkedServicesCount} service(s) are currently associated with it`, null, 400);
    }
    await category_model_1.default.findByIdAndDelete(id);
    return (0, envelope_1.ok)(res, null, "Category deleted successfully");
}
//# sourceMappingURL=deleteCategory.controller.js.map