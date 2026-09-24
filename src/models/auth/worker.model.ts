import mongoose, { Document, Model, Schema, Types } from "mongoose";

export enum AvailabilityStatus {
  FULL_TIME = "Full-Time",
  PART_TIME = "Part-Time",
}

export enum VerificationStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
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

const WorkerSchema = new Schema<IWorker>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    cooperativeId: {
      type: Schema.Types.ObjectId,
      ref: "Cooperative",
      required: [true, "Cooperative ID is required"],
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: false,
      index: true,
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    skills: [
      {
        type: Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    availability: {
      type: String,
      enum: Object.values(AvailabilityStatus),
      default: AvailabilityStatus.FULL_TIME,
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
      required: true,
      index: true,
    },
    verificationDocuments: {
      identity: {
        url: {
          type: String,
          required: true,
          trim: true,
        },
        status: {
          type: String,
          enum: Object.values(VerificationStatus),
          default: VerificationStatus.PENDING,
        },
        rejectionReason: {
          type: String,
          trim: true,
        },
      },
      certificate: {
        url: {
          type: String,
          required: true,
          trim: true,
        },
        status: {
          type: String,
          enum: Object.values(VerificationStatus),
          default: VerificationStatus.PENDING,
        },
        rejectionReason: {
          type: String,
          trim: true,
        },
      },
    },
    experience: {
      type: Number,
      min: 0,
      default: 0,
    },
    location: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      latitude: {
        type: Number,
        default: 0.0,
      },
      longitude: {
        type: Number,
        default: 0.0,
      },
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalJobsCompleted: {
      type: Number,
      min: 0,
      default: 0,
    },
    weeklyServiceLimit: {
      type: Number,
      min: 1,
      default: 6,
    },
    weeklyAcceptedCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    weeklyResetDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

WorkerSchema.index({
  verificationStatus: 1,
  isActive: 1,
});

WorkerSchema.index({
  skills: 1,
});

const Worker: Model<IWorker> =
  mongoose.models.Worker ||
  mongoose.model<IWorker>("Worker", WorkerSchema);

export default Worker;