import mongoose, { Document, Model, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";

export enum UserRole {
  WORKER = "WORKER",
  CUSTOMER = "CUSTOMER",
  COOPERATIVE = "COOPERATIVE",
  SUPERADMIN = "SUPERADMIN",
}

export enum AccountStatus {
  SUSPEND = "SUSPEND",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  landmark?: string;
}

export interface ISavedAddress {
  _id?: Types.ObjectId | string;
  title: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  landmark?: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;

  role: UserRole[];

  profilePicture?: string;

  isEmailVerified: boolean;
  isActive: boolean;

  emailVerificationToken?: string;
  emailVerificationExpires?: Date;

  passwordResetToken?: string;
  passwordResetExpires?: Date;

  address: IAddress;
  savedAddresses: ISavedAddress[];
  location: ILocation;

  accountStatus: AccountStatus;
  lastLoginAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const addressSchema = new Schema<IAddress>(
  {
    street: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    zip: { type: String, default: "", trim: true },
    country: { type: String, default: "India", trim: true },
    landmark: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const savedAddressSchema = new Schema<ISavedAddress>(
  {
    title: { type: String, default: "Home", trim: true },
    street: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
    },
    city: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    zip: { type: String, default: "", trim: true },
    country: { type: String, default: "India", trim: true },
    landmark: { type: String, default: "", trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const locationSchema = new Schema<ILocation>(
  {
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
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      maxlength: [20, "Phone number cannot exceed 20 characters"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must contain at least 8 characters"],
      select: false,
    },

    role: {
      type: [String],
      enum: Object.values(UserRole),
      required: true,
      default: [UserRole.CUSTOMER],
      index: true,
    },

    profilePicture: {
      type: String,
      default: "",
      trim: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    address: {
      type: addressSchema,
      default: () => ({
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "India",
        landmark: "",
      }),
    },

    savedAddresses: {
      type: [savedAddressSchema],
      default: [],
    },

    location: {
      type: locationSchema,
      default: () => ({
        type: "Point",
        coordinates: [0, 0],
      }),
    },

    accountStatus: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.ACTIVE,
      index: true,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;