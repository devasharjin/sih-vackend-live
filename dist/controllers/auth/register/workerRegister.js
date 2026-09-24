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
exports.workerRegister = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const user_model_1 = __importStar(require("../../../models/auth/user.model"));
const worker_model_1 = __importStar(require("../../../models/auth/worker.model"));
const category_model_1 = __importDefault(require("../../../models/category.model"));
const service_model_1 = __importDefault(require("../../../models/service.model"));
const envelope_1 = require("../../../shared/envelope");
const jwt_utils_1 = require("../../../utils/jwt.utils");
const cookie_utils_1 = require("../../../utils/cookie.utils");
const cloudinaryservices_1 = require("../../../services/cloudinaryservices");
const workerRegister = async (req, res) => {
    // 1. Check user authentication
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized. Please log in first.", null, 401);
    }
    const userId = req.user.id || req.user.userId;
    // 2. Check if worker profile already exists for this user
    const existingWorker = await worker_model_1.default.findOne({ userId });
    if (existingWorker) {
        return (0, envelope_1.fail)(res, "Worker profile already exists for this account.", null, 409);
    }
    // 3. Extract request body fields (support JSON or multipart/form-data)
    let { cooperativeId, category, categoryId, categories, categoryIds, skills, availability, experience, yearsOfExperience, location, address, city, state, pincode, latitude, longitude, } = req.body;
    // Extract raw category inputs
    let rawCategories = [];
    const primaryCat = categoryId || category;
    if (primaryCat) {
        rawCategories.push(primaryCat);
    }
    const multiCat = categoryIds || categories;
    if (multiCat) {
        if (typeof multiCat === "string") {
            try {
                const parsed = JSON.parse(multiCat);
                if (Array.isArray(parsed))
                    rawCategories.push(...parsed);
                else
                    rawCategories.push(multiCat);
            }
            catch {
                rawCategories.push(...multiCat.split(",").map((c) => c.trim()).filter(Boolean));
            }
        }
        else if (Array.isArray(multiCat)) {
            rawCategories.push(...multiCat);
        }
    }
    // Parse legacy skills if passed
    let skillList = [];
    if (typeof skills === "string") {
        try {
            skillList = JSON.parse(skills);
        }
        catch {
            skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
        }
    }
    else if (Array.isArray(skills)) {
        skillList = skills;
    }
    // Support direct trade services / skills
    let directServiceInputs = [];
    const rawDirect = req.body.services || req.body.serviceIds || req.body.trades;
    if (rawDirect) {
        if (typeof rawDirect === "string") {
            try {
                const parsed = JSON.parse(rawDirect);
                if (Array.isArray(parsed))
                    directServiceInputs.push(...parsed);
                else
                    directServiceInputs.push(rawDirect);
            }
            catch {
                directServiceInputs.push(...rawDirect.split(",").map((s) => s.trim()).filter(Boolean));
            }
        }
        else if (Array.isArray(rawDirect)) {
            directServiceInputs.push(...rawDirect);
        }
    }
    // Resolve valid Categories (for backwards compatibility if passed)
    let validCategoryObjectIds = [];
    const candidateCatIds = [...new Set(rawCategories)]
        .map((c) => (typeof c === "object" && c?._id ? String(c._id) : String(c).trim()))
        .filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
    if (candidateCatIds.length > 0) {
        const existingCats = await category_model_1.default.find({
            _id: { $in: candidateCatIds.map((id) => new mongoose_1.Types.ObjectId(id)) },
        }).select("_id name");
        validCategoryObjectIds = existingCats.map((c) => c._id);
    }
    // Resolve candidate skills from direct service inputs or skillList
    const allCandidateSkillIds = [
        ...new Set([
            ...directServiceInputs.map((s) => (typeof s === "object" && s?._id ? String(s._id) : String(s).trim())),
            ...skillList.map((s) => (typeof s === "object" && s?._id ? String(s._id) : String(s).trim())),
        ]),
    ].filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
    let resolvedServices = [];
    if (allCandidateSkillIds.length > 0) {
        resolvedServices = await service_model_1.default.find({
            _id: { $in: allCandidateSkillIds.map((id) => new mongoose_1.Types.ObjectId(id)) },
            isActive: true,
        }).select("_id category");
    }
    // Also include category services if category was provided
    if (validCategoryObjectIds.length > 0) {
        const categoryServices = await service_model_1.default.find({
            category: { $in: validCategoryObjectIds },
            isActive: true,
        }).select("_id");
        resolvedServices.push(...categoryServices);
    }
    const skillObjectIds = [
        ...new Set(resolvedServices.map((s) => s._id.toString())),
    ].map((id) => new mongoose_1.Types.ObjectId(id));
    if (skillObjectIds.length === 0 && validCategoryObjectIds.length === 0) {
        return (0, envelope_1.fail)(res, "Please select at least one trade service (e.g. Plumber, Electrician, Gardener).", null, 400);
    }
    // Parse availability
    if (availability &&
        !Object.values(worker_model_1.AvailabilityStatus).includes(availability)) {
        return (0, envelope_1.fail)(res, `Invalid availability status. Must be one of: ${Object.values(worker_model_1.AvailabilityStatus).join(", ")}`, null, 400);
    }
    const workerAvailability = availability || worker_model_1.AvailabilityStatus.FULL_TIME;
    // Parse experience
    const rawExp = experience !== undefined ? experience : yearsOfExperience;
    const parsedExperience = Number(rawExp);
    if (isNaN(parsedExperience) || parsedExperience < 0) {
        return (0, envelope_1.fail)(res, "Experience must be a valid non-negative number.", null, 400);
    }
    // Parse location
    let parsedLocation = {
        address: "",
        city: "",
        state: "",
        pincode: "",
        latitude: 0,
        longitude: 0,
    };
    if (typeof location === "string") {
        try {
            parsedLocation = { ...parsedLocation, ...JSON.parse(location) };
        }
        catch {
            // Fallback
        }
    }
    else if (typeof location === "object" && location !== null) {
        parsedLocation = { ...parsedLocation, ...location };
    }
    // Fallback to top-level fields
    if (!parsedLocation.address && address)
        parsedLocation.address = String(address).trim();
    if (!parsedLocation.city && city)
        parsedLocation.city = String(city).trim();
    if (!parsedLocation.state && state)
        parsedLocation.state = String(state).trim();
    if (!parsedLocation.pincode && pincode)
        parsedLocation.pincode = String(pincode).trim();
    if (latitude !== undefined)
        parsedLocation.latitude = Number(latitude) || 0;
    if (longitude !== undefined)
        parsedLocation.longitude = Number(longitude) || 0;
    if (!parsedLocation.address ||
        !parsedLocation.city ||
        !parsedLocation.state ||
        !parsedLocation.pincode) {
        return (0, envelope_1.fail)(res, "Complete location details (address, city, state, pincode) are required.", null, 400);
    }
    // Validate cooperativeId (mandatory - independent worker is not permitted)
    if (!cooperativeId ||
        typeof cooperativeId !== "string" ||
        cooperativeId === "none" ||
        cooperativeId === "null" ||
        !cooperativeId.trim()) {
        return (0, envelope_1.fail)(res, "Cooperative society selection is mandatory. You must choose an affiliated cooperative.", null, 400);
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(cooperativeId.trim())) {
        return (0, envelope_1.fail)(res, "Invalid cooperative ID selected.", null, 400);
    }
    const validCoopId = new mongoose_1.Types.ObjectId(cooperativeId.trim());
    // 4. Handle verification documents (identity & certificate)
    const files = req.files;
    const identityFile = files?.identity?.[0];
    const certificateFile = files?.certificate?.[0];
    let identityUrl = req.body.identityUrl || "";
    let certificateUrl = req.body.certificateUrl || "";
    // Upload verification documents concurrently for maximum performance
    try {
        const [identityUploadRes, certUploadRes] = await Promise.all([
            identityFile
                ? (0, cloudinaryservices_1.uploadToCloudinary)(identityFile, {
                    folder: "workers/identity",
                })
                : null,
            certificateFile
                ? (0, cloudinaryservices_1.uploadToCloudinary)(certificateFile, {
                    folder: "workers/certificates",
                })
                : null,
        ]);
        if (identityUploadRes) {
            identityUrl = identityUploadRes.secure_url;
        }
        if (certUploadRes) {
            certificateUrl = certUploadRes.secure_url;
        }
    }
    catch (err) {
        return (0, envelope_1.fail)(res, `Verification document upload failed: ${err?.message || "Cloud error"}`, null, 500);
    }
    // Ensure both verification documents are present
    if (!identityUrl) {
        return (0, envelope_1.fail)(res, "Identity verification document is required (e.g. Aadhaar, Passport, or Government ID).", null, 400);
    }
    if (!certificateUrl) {
        return (0, envelope_1.fail)(res, "Professional trade certificate is required (e.g. ITI, Diploma, or Trade Certificate).", null, 400);
    }
    // 5. Create Worker document
    const worker = await worker_model_1.default.create({
        userId,
        cooperativeId: validCoopId,
        category: validCategoryObjectIds[0] || undefined,
        categories: validCategoryObjectIds.length > 0 ? validCategoryObjectIds : undefined,
        skills: skillObjectIds,
        availability: workerAvailability,
        verificationStatus: worker_model_1.VerificationStatus.PENDING,
        verificationDocuments: {
            identity: {
                url: identityUrl,
                status: worker_model_1.VerificationStatus.PENDING,
            },
            certificate: {
                url: certificateUrl,
                status: worker_model_1.VerificationStatus.PENDING,
            },
        },
        experience: parsedExperience,
        location: {
            address: parsedLocation.address,
            city: parsedLocation.city,
            state: parsedLocation.state,
            pincode: parsedLocation.pincode,
            latitude: parsedLocation.latitude ?? 0,
            longitude: parsedLocation.longitude ?? 0,
        },
        rating: 0,
        totalJobsCompleted: 0,
        isActive: true,
    });
    // 6. Update User role
    const updatedUser = await user_model_1.default.findByIdAndUpdate(userId, { $addToSet: { role: user_model_1.UserRole.WORKER } }, { new: true });
    // 7. Re-issue JWT tokens with updated role
    let tokens;
    if (updatedUser) {
        tokens = (0, jwt_utils_1.generateAuthTokens)(updatedUser);
        (0, cookie_utils_1.setAuthCookies)(res, tokens);
    }
    const populatedWorker = await worker_model_1.default.findById(worker._id)
        .populate("category", "name icon slug description")
        .populate("categories", "name icon slug description")
        .populate("skills", "name description category priceType hourlyPrice metersPrice")
        .populate("cooperativeId", "cooperativeName cooperativeAddress");
    return (0, envelope_1.ok)(res, { worker: populatedWorker || worker, user: updatedUser, tokens }, "Worker registration submitted successfully! Your profile is pending verification.");
};
exports.workerRegister = workerRegister;
//# sourceMappingURL=workerRegister.js.map