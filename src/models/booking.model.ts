import mongoose, { Document, Model, Schema, Types } from "mongoose";

export enum BookingStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  REJECTED = "REJECTED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}


export enum CancelledByRole {
  CUSTOMER = "CUSTOMER",
  WORKER = "WORKER",
  COOPERATIVE = "COOPERATIVE",
  SUPERADMIN = "SUPERADMIN",
}

export enum BookingType {
  SCHEDULED = "SCHEDULED",
  PREMIUM = "PREMIUM",
  ON_DEMAND = "ON_DEMAND",
  EMERGENCY = "EMERGENCY",
}

export enum UrgencyLevel {
  STANDARD = "STANDARD",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface IBookingEmergencyDetails {
  hazardType?: string;
  severity?: "CRITICAL" | "HIGH" | "MEDIUM";
  immediateContact?: string;
  notes?: string;
}

export type BookingPriceType = "hourly" | "meters";

export interface IBookingAddress {
  street: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}


export interface IBookingPaymentDetails {
  transactionId?: string;
  paidAt?: Date;
}

export interface IBookingPricingSnapshot {
  firstHourRate: number;
  additionalHourRate: number;
  transportFee: number;
  cooperativePercentage: number;
  insurancePercentage: number;
  actualDurationMinutes: number;
  billableHours: number;
  firstHourCharge: number;
  additionalHoursCharge: number;
  serviceAmount: number;
  cooperativeShareAmount: number;
  insuranceShareAmount: number;
  workerNetEarnings: number;
  customerTotalAmount: number;
  isFinalized: boolean;
}

export interface IBooking extends Document {
  bookingNumber: string;
  customer: Types.ObjectId;
  customerId?: Types.ObjectId;
  service: Types.ObjectId;
  serviceId?: Types.ObjectId;
  category?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  cooperative?: Types.ObjectId;
  cooperativeId?: Types.ObjectId;
  worker?: Types.ObjectId;
  workerId?: Types.ObjectId;

  // Service Location & Timing
  address: IBookingAddress;
  scheduledDate: Date;
  customerNotes?: string;

  // Booking Classification & Urgency
  bookingType: BookingType;
  isEmergency: boolean;
  urgencyLevel?: UrgencyLevel;
  emergencyDetails?: IBookingEmergencyDetails;

  // Pricing & Payment
  priceType: BookingPriceType;
  rate: number;
  units: number;
  totalAmount: number;
  pricing?: IBookingPricingSnapshot;
  paymentStatus: PaymentStatus;
  paymentDetails?: IBookingPaymentDetails;

  // Lifecycle & Tracking
  status: BookingStatus;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: CancelledByRole;

  // Rating Reference
  rating?: Types.ObjectId;
  ratingId?: Types.ObjectId;
  isRated: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const generateBookingNumber = (): string => {
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `BKG-${dateStr}-${randomSuffix}`;
};

const bookingSchema = new Schema<IBooking>(
  {
    bookingNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      default: generateBookingNumber,
      index: true,
    },

    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer reference is required"],
      index: true,
      alias: "customerId",
    },

    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service reference is required"],
      index: true,
      alias: "serviceId",
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      index: true,
      alias: "categoryId",
    },

    cooperative: {
      type: Schema.Types.ObjectId,
      ref: "Cooperative",
      index: true,
      alias: "cooperativeId",
    },

    worker: {
      type: Schema.Types.ObjectId,
      ref: "Worker",
      index: true,
      alias: "workerId",
    },

    address: {
      street: {
        type: String,
        required: [true, "Street / address is required"],
        trim: true,
      },
      city: {
        type: String,
        trim: true,
        default: "",
      },
      state: {
        type: String,
        trim: true,
        default: "",
      },
      pincode: {
        type: String,
        trim: true,
        default: "",
      },
      landmark: {
        type: String,
        trim: true,
        default: "",
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          default: [0, 0],
        },
      },
    },

    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date and time is required"],
      index: true,
    },

    customerNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },

    bookingType: {
      type: String,
      enum: Object.values(BookingType),
      default: BookingType.SCHEDULED,
      index: true,
    },

    isEmergency: {
      type: Boolean,
      default: false,
      index: true,
    },

    urgencyLevel: {
      type: String,
      enum: Object.values(UrgencyLevel),
      default: UrgencyLevel.STANDARD,
    },

    emergencyDetails: {
      hazardType: { type: String, trim: true },
      severity: { type: String, trim: true },
      immediateContact: { type: String, trim: true, default: "" },
      notes: { type: String, trim: true, default: "" },
    },

    priceType: {
      type: String,
      enum: {
        values: ["hourly", "meters"],
        message: "Price type must be either hourly or meters",
      },
      required: [true, "Price type is required"],
    },

    rate: {
      type: Number,
      required: [true, "Service rate is required"],
      min: [0, "Rate cannot be negative"],
    },

    units: {
      type: Number,
      default: 1,
      min: [0.1, "Units must be at least 0.1"],
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },

    pricing: {
      firstHourRate: { type: Number, default: 0 },
      additionalHourRate: { type: Number, default: 0 },
      transportFee: { type: Number, default: 30 },
      cooperativePercentage: { type: Number, default: 10 },
      insurancePercentage: { type: Number, default: 5 },
      actualDurationMinutes: { type: Number, default: 0 },
      billableHours: { type: Number, default: 1 },
      firstHourCharge: { type: Number, default: 0 },
      additionalHoursCharge: { type: Number, default: 0 },
      serviceAmount: { type: Number, default: 0 },
      cooperativeShareAmount: { type: Number, default: 0 },
      insuranceShareAmount: { type: Number, default: 0 },
      workerNetEarnings: { type: Number, default: 0 },
      customerTotalAmount: { type: Number, default: 0 },
      isFinalized: { type: Boolean, default: false },
    },

    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    paymentDetails: {
      transactionId: {
        type: String,
        trim: true,
      },
      paidAt: {
        type: Date,
      },
    },

    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
      index: true,
    },

    assignedAt: {
      type: Date,
    },

    startedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    cancelledAt: {
      type: Date,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
    },

    cancelledBy: {
      type: String,
      enum: Object.values(CancelledByRole),
    },

    rating: {
      type: Schema.Types.ObjectId,
      ref: "Rating",
      alias: "ratingId",
    },

    isRated: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal performance across dashboard queries
bookingSchema.index({ isEmergency: -1, status: 1, createdAt: -1 });
bookingSchema.index({ bookingType: 1, status: 1 });
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ worker: 1, status: 1 });
bookingSchema.index({ cooperative: 1, status: 1 });
bookingSchema.index({ status: 1, scheduledDate: 1 });
bookingSchema.index({ createdAt: -1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;
