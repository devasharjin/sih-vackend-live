import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

// In-memory storage for streaming directly to Cloudinary
const storage = multer.memoryStorage();

// Allowed MIME types for worker verification documents and general media
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "application/pdf",
];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only JPEG, PNG, WebP, and PDF files are allowed.`
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter,
});

// Middleware for worker registration verification documents
export const workerDocumentsUpload = upload.fields([
  { name: "identity", maxCount: 1 },
  { name: "certificate", maxCount: 1 },
]);

// Middleware for cooperative registration verification documents & logo
export const cooperativeDocumentsUpload = upload.fields([
  { name: "cooperativeLogo", maxCount: 1 },
  { name: "verificationCertificate", maxCount: 1 },
]);

export default upload;
