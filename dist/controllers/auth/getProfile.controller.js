"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
const user_model_1 = __importStar(require("../../models/auth/user.model"));
const worker_model_1 = __importDefault(require("../../models/auth/worker.model"));
const cooperative_model_1 = __importDefault(require("../../models/auth/cooperative.model"));
const envelope_1 = require("../../shared/envelope");
async function getProfile(req, res) {
    // 1. Verify user payload from auth middleware
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user.id;
    // 2. Fetch base user document
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        return (0, envelope_1.fail)(res, "User not found", null, 404);
    }
    let worker = null;
    let cooperative = null;
    // 3. Fetch role-specific profile details with lean projections
    if (user.role.includes(user_model_1.UserRole.WORKER) || user.role.includes(user_model_1.UserRole.CUSTOMER)) {
        const workerDoc = await worker_model_1.default.findOne({ userId })
            .populate("cooperativeId", "cooperativeName cooperativeAddress cooperativePhone cooperativeEmail")
            .populate("category", "name icon slug description")
            .populate("categories", "name icon slug description")
            .populate("skills", "name description priceType hourlyPrice metersPrice")
            .lean();
        if (workerDoc) {
            // Prevent multi-megabyte base64 strings from bloating the auth payload
            if (workerDoc.verificationDocuments) {
                if (workerDoc.verificationDocuments.identity?.url?.startsWith("data:")) {
                    workerDoc.verificationDocuments.identity.url = "data_document_uploaded";
                }
                if (workerDoc.verificationDocuments.certificate?.url?.startsWith("data:")) {
                    workerDoc.verificationDocuments.certificate.url = "data_document_uploaded";
                }
            }
            worker = workerDoc;
        }
    }
    if (user.role.includes(user_model_1.UserRole.COOPERATIVE)) {
        const coopDoc = await cooperative_model_1.default.findOne({ userId }).lean();
        if (coopDoc) {
            if (coopDoc.cooperativeLogo?.url?.startsWith("data:")) {
                coopDoc.cooperativeLogo.url = "data_logo_uploaded";
            }
            if (coopDoc.verificationCertificate?.url?.startsWith("data:")) {
                coopDoc.verificationCertificate.url = "data_certificate_uploaded";
            }
            cooperative = coopDoc;
        }
    }
    const profile = worker || cooperative || null;
    return (0, envelope_1.ok)(res, {
        user,
        worker,
        cooperative,
        profile,
    }, "User profile retrieved successfully");
}
//# sourceMappingURL=getProfile.controller.js.map