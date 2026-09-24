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
exports.cooperativeRegister = void 0;
const user_model_1 = __importStar(require("../../../models/auth/user.model"));
const cooperative_model_1 = __importDefault(require("../../../models/auth/cooperative.model"));
const worker_model_1 = require("../../../models/auth/worker.model");
const envelope_1 = require("../../../shared/envelope");
const jwt_utils_1 = require("../../../utils/jwt.utils");
const cookie_utils_1 = require("../../../utils/cookie.utils");
const cloudinaryservices_1 = require("../../../services/cloudinaryservices");
const cooperativeRegister = async (req, res) => {
    // 1. User ID attached by authentication middleware
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized. Please log in first.", null, 401);
    }
    const userId = req.user.id || req.user.userId;
    // 2. Check if cooperative profile already exists for this user
    const existingCooperative = await cooperative_model_1.default.findOne({ userId });
    if (existingCooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile already exists for this user", null, 409);
    }
    const { cooperativeName, cooperativeAddress, cooperativePhone, cooperativeEmail, } = req.body;
    // 3. Validate required text fields
    if (!cooperativeName || typeof cooperativeName !== "string" || !cooperativeName.trim()) {
        return (0, envelope_1.fail)(res, "Cooperative legal name is required", null, 400);
    }
    if (!cooperativeAddress || typeof cooperativeAddress !== "string" || !cooperativeAddress.trim()) {
        return (0, envelope_1.fail)(res, "Cooperative registered address is required", null, 400);
    }
    if (!cooperativePhone || typeof cooperativePhone !== "string" || !cooperativePhone.trim()) {
        return (0, envelope_1.fail)(res, "Cooperative contact phone number is required", null, 400);
    }
    if (!cooperativeEmail || typeof cooperativeEmail !== "string" || !cooperativeEmail.trim()) {
        return (0, envelope_1.fail)(res, "Cooperative official email is required", null, 400);
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cooperativeEmail.trim())) {
        return (0, envelope_1.fail)(res, "Invalid cooperative email format", null, 400);
    }
    // 4. Handle file uploads (cooperativeLogo & verificationCertificate)
    const files = req.files;
    const logoFile = files?.cooperativeLogo?.[0];
    const certificateFile = files?.verificationCertificate?.[0];
    let logoData = null;
    let certificateData = null;
    // Upload logo and certificate concurrently for maximum performance
    try {
        const [logoUploadRes, certUploadRes] = await Promise.all([
            logoFile
                ? (0, cloudinaryservices_1.uploadToCloudinary)(logoFile, {
                    folder: "cooperatives/logos",
                })
                : null,
            certificateFile
                ? (0, cloudinaryservices_1.uploadToCloudinary)(certificateFile, {
                    folder: "cooperatives/certificates",
                })
                : null,
        ]);
        if (logoUploadRes) {
            logoData = {
                url: logoUploadRes.secure_url,
                publicId: logoUploadRes.public_id,
            };
        }
        else if (req.body.cooperativeLogoUrl) {
            logoData = {
                url: req.body.cooperativeLogoUrl,
                publicId: req.body.cooperativeLogoPublicId || `coop_logo_${Date.now()}`,
            };
        }
        if (certUploadRes) {
            certificateData = {
                url: certUploadRes.secure_url,
                publicId: certUploadRes.public_id,
            };
        }
        else if (req.body.verificationCertificateUrl) {
            certificateData = {
                url: req.body.verificationCertificateUrl,
                publicId: req.body.verificationCertificatePublicId || `coop_cert_${Date.now()}`,
            };
        }
    }
    catch (err) {
        return (0, envelope_1.fail)(res, `Document upload failed: ${err?.message || "Cloud error"}`, null, 500);
    }
    // Ensure both verification documents are present
    if (!logoData || !logoData.url) {
        return (0, envelope_1.fail)(res, "Cooperative society logo is required (JPG, PNG, or WebP).", null, 400);
    }
    if (!certificateData || !certificateData.url) {
        return (0, envelope_1.fail)(res, "Official cooperative registration certificate or bylaws document is required (PDF, JPG, PNG).", null, 400);
    }
    // 5. Create cooperative profile
    const cooperative = await cooperative_model_1.default.create({
        userId,
        cooperativeName: cooperativeName.trim(),
        cooperativeAddress: cooperativeAddress.trim(),
        cooperativePhone: cooperativePhone.trim(),
        cooperativeEmail: cooperativeEmail.trim().toLowerCase(),
        cooperativeLogo: logoData,
        verificationCertificate: certificateData,
        verificationStatus: worker_model_1.VerificationStatus.PENDING,
    });
    // 6. Add COOPERATIVE role to user's role array and retrieve updated user
    const updatedUser = await user_model_1.default.findByIdAndUpdate(userId, { $addToSet: { role: user_model_1.UserRole.COOPERATIVE } }, { new: true });
    let tokens;
    if (updatedUser) {
        tokens = (0, jwt_utils_1.generateAuthTokens)(updatedUser);
        (0, cookie_utils_1.setAuthCookies)(res, tokens);
    }
    return (0, envelope_1.ok)(res, { cooperative, user: updatedUser, tokens }, "Cooperative registration submitted successfully for verification");
};
exports.cooperativeRegister = cooperativeRegister;
//# sourceMappingURL=cooperativeRegister.js.map