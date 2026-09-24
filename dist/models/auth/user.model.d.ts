import { Document, Model, Types } from "mongoose";
export declare enum UserRole {
    WORKER = "WORKER",
    CUSTOMER = "CUSTOMER",
    COOPERATIVE = "COOPERATIVE",
    SUPERADMIN = "SUPERADMIN"
}
export declare enum AccountStatus {
    SUSPEND = "SUSPEND",
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
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
    coordinates: [number, number];
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
declare const User: Model<IUser>;
export default User;
//# sourceMappingURL=user.model.d.ts.map