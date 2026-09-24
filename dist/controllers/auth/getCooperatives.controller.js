"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCooperatives = void 0;
const cooperative_model_1 = __importDefault(require("../../models/auth/cooperative.model"));
const envelope_1 = require("../../shared/envelope");
const getCooperatives = async (_req, res) => {
    const cooperatives = await cooperative_model_1.default.find({}, "_id cooperativeName cooperativeAddress cooperativePhone services verificationStatus").sort({ cooperativeName: 1 });
    return (0, envelope_1.ok)(res, cooperatives, "Cooperatives retrieved successfully");
};
exports.getCooperatives = getCooperatives;
//# sourceMappingURL=getCooperatives.controller.js.map