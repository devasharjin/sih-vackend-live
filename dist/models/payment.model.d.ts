import { Document, Model, Types } from "mongoose";
export declare enum PaymentRecordStatus {
    CREATED = "CREATED",
    PAID = "PAID",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export interface IPayment extends Document {
    booking: Types.ObjectId;
    customer: Types.ObjectId;
    worker?: Types.ObjectId;
    cooperative?: Types.ObjectId;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    amount: number;
    currency: string;
    status: PaymentRecordStatus;
    paymentMethod?: string;
    receipt?: string;
    errorDescription?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const Payment: Model<IPayment>;
export default Payment;
//# sourceMappingURL=payment.model.d.ts.map