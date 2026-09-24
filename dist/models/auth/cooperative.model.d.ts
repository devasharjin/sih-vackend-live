import mongoose, { Document, Model } from "mongoose";
import { VerificationStatus } from "./worker.model";
export interface ICooperative extends Document {
    userId: mongoose.Types.ObjectId;
    cooperativeName: string;
    cooperativeAddress: string;
    cooperativePhone: string;
    cooperativeEmail: string;
    verificationStatus: VerificationStatus;
    rejectedReason?: string;
    cooperativeLogo: {
        url: string;
        publicId: string;
    };
    verificationCertificate: {
        url: string;
        publicId: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
declare const Cooperative: Model<ICooperative>;
export default Cooperative;
//# sourceMappingURL=cooperative.model.d.ts.map