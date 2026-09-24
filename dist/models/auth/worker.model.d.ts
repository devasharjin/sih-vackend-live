import { Document, Model, Types } from "mongoose";
export declare enum AvailabilityStatus {
    FULL_TIME = "Full-Time",
    PART_TIME = "Part-Time"
}
export declare enum VerificationStatus {
    PENDING = "Pending",
    APPROVED = "Approved",
    REJECTED = "Rejected"
}
export interface IVerificationDocuments {
    identity: {
        url: string;
        status: VerificationStatus;
        rejectionReason?: string;
    };
    certificate: {
        url: string;
        status: VerificationStatus;
        rejectionReason?: string;
    };
}
export interface IWorker extends Document {
    userId: Types.ObjectId;
    cooperativeId: Types.ObjectId;
    category?: Types.ObjectId;
    categories?: Types.ObjectId[];
    skills: Types.ObjectId[];
    availability: AvailabilityStatus;
    verificationStatus: VerificationStatus;
    verificationDocuments: IVerificationDocuments;
    experience: number;
    location: {
        address: string;
        city: string;
        state: string;
        pincode: string;
        latitude?: number;
        longitude?: number;
    };
    rating: number;
    totalJobsCompleted: number;
    weeklyServiceLimit: number;
    weeklyAcceptedCount: number;
    weeklyResetDate?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const Worker: Model<IWorker>;
export default Worker;
//# sourceMappingURL=worker.model.d.ts.map