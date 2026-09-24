"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cooperativeDocumentsUpload = exports.workerDocumentsUpload = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// In-memory storage for streaming directly to Cloudinary
const storage = multer_1.default.memoryStorage();
// Allowed MIME types for worker verification documents and general media
const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "application/pdf",
];
const fileFilter = (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, WebP, and PDF files are allowed.`));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
    },
    fileFilter,
});
// Middleware for worker registration verification documents
exports.workerDocumentsUpload = exports.upload.fields([
    { name: "identity", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
]);
// Middleware for cooperative registration verification documents & logo
exports.cooperativeDocumentsUpload = exports.upload.fields([
    { name: "cooperativeLogo", maxCount: 1 },
    { name: "verificationCertificate", maxCount: 1 },
]);
exports.default = exports.upload;
//# sourceMappingURL=multer.middleware.js.map