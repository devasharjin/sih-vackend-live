"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountStatus = exports.UserRole = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
var UserRole;
(function (UserRole) {
    UserRole["WORKER"] = "WORKER";
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["COOPERATIVE"] = "COOPERATIVE";
    UserRole["SUPERADMIN"] = "SUPERADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["SUSPEND"] = "SUSPEND";
    AccountStatus["ACTIVE"] = "ACTIVE";
    AccountStatus["INACTIVE"] = "INACTIVE";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
const addressSchema = new mongoose_1.Schema({
    street: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    zip: { type: String, default: "", trim: true },
    country: { type: String, default: "India", trim: true },
    landmark: { type: String, default: "", trim: true },
}, { _id: false });
const savedAddressSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
const locationSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ["Point"],
        default: "Point",
    },
    coordinates: {
        type: [Number],
        default: [0, 0],
    },
}, { _id: false });
const userSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    versionKey: false,
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password)
        return false;
    return await bcryptjs_1.default.compare(candidatePassword, this.password);
};
const User = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
exports.default = User;
//# sourceMappingURL=user.model.js.map