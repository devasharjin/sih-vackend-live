export interface CloudinaryUploadResult {
    url: string;
    secure_url: string;
    public_id: string;
    format?: string;
    resource_type?: string;
    bytes?: number;
}
export interface UploadOptions {
    folder?: string;
    public_id?: string;
    resource_type?: "auto" | "image" | "raw" | "video";
    transformation?: any;
}
/**
 * Upload a single file (Multer file, Buffer, or data URI/URL) to Cloudinary
 */
export declare function uploadToCloudinary(file: Express.Multer.File | Buffer | string, options?: UploadOptions): Promise<CloudinaryUploadResult>;
/**
 * Upload multiple files to Cloudinary concurrently
 */
export declare function uploadManyToCloudinary(files: (Express.Multer.File | Buffer | string)[], options?: UploadOptions): Promise<CloudinaryUploadResult[]>;
/**
 * Delete a file from Cloudinary by its public ID
 */
export declare function deleteFromCloudinary(publicId: string, resourceType?: "image" | "raw" | "video"): Promise<any>;
declare const _default: {
    uploadToCloudinary: typeof uploadToCloudinary;
    uploadManyToCloudinary: typeof uploadManyToCloudinary;
    deleteFromCloudinary: typeof deleteFromCloudinary;
};
export default _default;
//# sourceMappingURL=cloudinaryservices.d.ts.map