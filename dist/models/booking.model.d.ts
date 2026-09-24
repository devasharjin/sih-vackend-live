import { Document, Model, Types } from "mongoose";
export declare enum BookingStatus {
    PENDING = "PENDING",
    ASSIGNED = "ASSIGNED",
    CONFIRMED = "CONFIRMED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    REJECTED = "REJECTED"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export declare enum CancelledByRole {
    CUSTOMER = "CUSTOMER",
    WORKER = "WORKER",
    COOPERATIVE = "COOPERATIVE",
    SUPERADMIN = "SUPERADMIN"
}
export declare enum BookingType {
    SCHEDULED = "SCHEDULED",
    PREMIUM = "PREMIUM",
    ON_DEMAND = "ON_DEMAND",
    EMERGENCY = "EMERGENCY"
}
export declare enum UrgencyLevel {
    STANDARD = "STANDARD",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
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
        coordinates: [number, number];
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
    address: IBookingAddress;
    scheduledDate: Date;
    customerNotes?: string;
    bookingType: BookingType;
    isEmergency: boolean;
    urgencyLevel?: UrgencyLevel;
    emergencyDetails?: IBookingEmergencyDetails;
    priceType: BookingPriceType;
    rate: number;
    units: number;
    totalAmount: number;
    pricing?: IBookingPricingSnapshot;
    paymentStatus: PaymentStatus;
    paymentDetails?: IBookingPaymentDetails;
    status: BookingStatus;
    assignedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    cancellationReason?: string;
    cancelledBy?: CancelledByRole;
    rating?: Types.ObjectId;
    ratingId?: Types.ObjectId;
    isRated: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const Booking: Model<IBooking>;
export default Booking;
//# sourceMappingURL=booking.model.d.ts.map