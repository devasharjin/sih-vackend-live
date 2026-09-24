import { Document, Model, Types } from "mongoose";
export declare enum WelfareClaimType {
    ACCIDENTAL_INJURY = "ACCIDENTAL_INJURY",
    MEDICAL_HOSPITALIZATION = "MEDICAL_HOSPITALIZATION",
    EMERGENCY_HARDSHIP = "EMERGENCY_HARDSHIP",
    TOOL_EQUIPMENT_LOSS = "TOOL_EQUIPMENT_LOSS",
    HEALTH_CHECKUP = "HEALTH_CHECKUP"
}
export declare enum WelfareClaimStatus {
    SUBMITTED = "SUBMITTED",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    DISBURSED = "DISBURSED"
}
export declare enum WelfareUrgency {
    STANDARD = "STANDARD",
    URGENT = "URGENT",
    CRITICAL = "CRITICAL"
}
export interface IWelfareDocument {
    title: string;
    url: string;
    uploadedAt: Date;
}
export interface IWelfareAuditEntry {
    action: string;
    performedBy: Types.ObjectId;
    performedByName?: string;
    performedByRole?: string;
    timestamp: Date;
    notes?: string;
}
export interface IWelfareClaim extends Document {
    claimNumber: string;
    worker: Types.ObjectId;
    workerUser: Types.ObjectId;
    cooperative: Types.ObjectId;
    booking?: Types.ObjectId;
    claimType: WelfareClaimType;
    urgency: WelfareUrgency;
    title: string;
    description: string;
    incidentDate: Date;
    amountRequested: number;
    amountApproved?: number;
    amountDisbursed?: number;
    status: WelfareClaimStatus;
    reviewNotes?: string;
    rejectionReason?: string;
    documents: IWelfareDocument[];
    disbursedAt?: Date;
    disbursementTxnId?: string;
    disbursementMethod?: string;
    auditLog: IWelfareAuditEntry[];
    createdAt: Date;
    updatedAt: Date;
}
declare const WelfareClaim: Model<IWelfareClaim>;
export default WelfareClaim;
//# sourceMappingURL=welfareClaim.model.d.ts.map