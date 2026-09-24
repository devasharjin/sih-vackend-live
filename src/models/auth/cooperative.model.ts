import mongoose, { Document, Model, Schema } from "mongoose";
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

const cooperativeSchema = new Schema<ICooperative>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
      index: true,
    },
    cooperativeName: {
      type: String,
      required: [true, "Cooperative name is required"],
      trim: true,
    },
    cooperativeAddress: {
      type: String,
      required: [true, "Cooperative address is required"],
      trim: true,
    },
    cooperativePhone: {
      type: String,
      required: [true, "Cooperative phone is required"],
      trim: true,
    },
    cooperativeEmail: {
      type: String,
      required: [true, "Cooperative email is required"],
      trim: true,
      lowercase: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
      index: true,
    },
    rejectedReason: {
      type: String,
      trim: true,
    },
    cooperativeLogo: {
      url: {
        type: String,
        required: [true, "Cooperative logo URL is required"],
        trim: true,
      },
      publicId: {
        type: String,
        required: [true, "Cooperative logo public ID is required"],
        trim: true,
      },
    },
    verificationCertificate: {
      url: {
        type: String,
        required: [true, "Verification certificate URL is required"],
        trim: true,
      },
      publicId: {
        type: String,
        required: [true, "Verification certificate public ID is required"],
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Cooperative: Model<ICooperative> =
  mongoose.models.Cooperative ||
  mongoose.model<ICooperative>("Cooperative", cooperativeSchema);

export default Cooperative;
