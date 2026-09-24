"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = uploadToCloudinary;
exports.uploadManyToCloudinary = uploadManyToCloudinary;
exports.deleteFromCloudinary = deleteFromCloudinary;
const stream_1 = require("stream");
const cloudinary_config_1 = __importDefault(require("../config/cloudinary.config"));
/**
 * Upload a single file (Multer file, Buffer, or data URI/URL) to Cloudinary
 */
async function uploadToCloudinary(file, options = {}) {
    // Graceful fallback for local development if Cloudinary credentials are not configured
    const hasCloudinaryConfig = Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
        Boolean(process.env.CLOUDINARY_API_KEY) &&
        process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name";
    if (!hasCloudinaryConfig) {
        if (typeof file === "string") {
            return {
                url: file,
                secure_url: file,
                public_id: `dev_doc_${Date.now()}`,
                format: "string",
            };
        }
        const buffer = Buffer.isBuffer(file) ? file : file.buffer;
        const mimeType = file?.mimetype || "application/octet-stream";
        const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
        return {
            url: dataUri,
            secure_url: dataUri,
            public_id: `dev_doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            format: mimeType.split("/")[1] || "bin",
            bytes: buffer.length,
        };
    }
    const uploadOptions = {
        folder: options.folder || "worker_verification_docs",
        resource_type: options.resource_type || "auto",
        public_id: options.public_id,
        transformation: options.transformation || [
            {
                width: 1600,
                height: 1600,
                crop: "limit",
                quality: "auto:good",
                fetch_format: "auto",
            },
        ],
    };
    // If file is a string (URL or base64 data URI)
    if (typeof file === "string") {
        const result = await cloudinary_config_1.default.uploader.upload(file, uploadOptions);
        return {
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            resource_type: result.resource_type,
            bytes: result.bytes,
        };
    }
    // If file is a Multer file or Buffer
    const buffer = Buffer.isBuffer(file) ? file : file.buffer;
    if (!buffer) {
        throw new Error("Invalid file buffer provided for Cloudinary upload.");
    }
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Cloudinary upload timed out after 20 seconds."));
        }, 20000);
        const uploadStream = cloudinary_config_1.default.uploader.upload_stream(uploadOptions, (error, result) => {
            clearTimeout(timeout);
            if (error || !result) {
                return reject(error || new Error("Cloudinary upload failed with empty result."));
            }
            resolve({
                url: result.url,
                secure_url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                resource_type: result.resource_type,
                bytes: result.bytes,
            });
        });
        // Stream the buffer to Cloudinary
        stream_1.Readable.from(buffer).pipe(uploadStream);
    });
}
/**
 * Upload multiple files to Cloudinary concurrently
 */
async function uploadManyToCloudinary(files, options = {}) {
    if (!files || files.length === 0) {
        return [];
    }
    const uploadPromises = files.map((file) => uploadToCloudinary(file, options));
    return Promise.all(uploadPromises);
}
/**
 * Delete a file from Cloudinary by its public ID
 */
async function deleteFromCloudinary(publicId, resourceType = "image") {
    return cloudinary_config_1.default.uploader.destroy(publicId, {
        resource_type: resourceType,
    });
}
exports.default = {
    uploadToCloudinary,
    uploadManyToCloudinary,
    deleteFromCloudinary,
};
//# sourceMappingURL=cloudinaryservices.js.map