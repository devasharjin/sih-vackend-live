import mongoose, { Document, Model, Schema, Types } from "mongoose";

export enum InquiryCategory {
  BOOKING_SERVICES = "Booking & Services",
  WORKER_AFFILIATION = "Worker Affiliation",
  COOPERATIVE_SOCIETY = "Cooperative Society",
  BILLING_PAYMENTS = "Billing & Payments",
  TECHNICAL_SUPPORT = "Technical Support",
  GENERAL_INQUIRY = "General Inquiry",
}

export enum InquiryStatus {
  NEW = "NEW",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
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

const generateTicketNumber = (): string => {
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `TKT-${dateStr}-${randomSuffix}`;
};

const contactMessageSchema = new Schema<IContactMessage>(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
      default: generateTicketNumber,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: Object.values(InquiryCategory),
      default: InquiryCategory.GENERAL_INQUIRY,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: Object.values(InquiryStatus),
      default: InquiryStatus.NEW,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const ContactMessage: Model<IContactMessage> =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>("ContactMessage", contactMessageSchema);

export default ContactMessage;
