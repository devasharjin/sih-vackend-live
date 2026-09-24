import { Document, Model, Types } from "mongoose";
export declare enum InquiryCategory {
    BOOKING_SERVICES = "Booking & Services",
    WORKER_AFFILIATION = "Worker Affiliation",
    COOPERATIVE_SOCIETY = "Cooperative Society",
    BILLING_PAYMENTS = "Billing & Payments",
    TECHNICAL_SUPPORT = "Technical Support",
    GENERAL_INQUIRY = "General Inquiry"
}
export declare enum InquiryStatus {
    NEW = "NEW",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED"
}
export interface IContactMessage extends Document {
    ticketNumber: string;
    name: string;
    email: string;
    phone?: string;
    category: InquiryCategory;
    subject: string;
    message: string;
    user?: Types.ObjectId;
    status: InquiryStatus;
    createdAt: Date;
    updatedAt: Date;
}
declare const ContactMessage: Model<IContactMessage>;
export default ContactMessage;
//# sourceMappingURL=contact.model.d.ts.map