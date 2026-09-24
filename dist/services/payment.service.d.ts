import { IPayment } from "../models/payment.model";
export interface CreateOrderResult {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    bookingNumber: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    isMock: boolean;
}
export interface VerifyPaymentParams {
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    paymentMethod?: string;
}
export declare class PaymentService {
    /**
     * Creates a Razorpay Order for a customer booking.
     */
    static createOrder(bookingId: string, customerId: string): Promise<CreateOrderResult>;
    /**
     * Verifies Razorpay payment signature and marks the booking and payment as PAID.
     */
    static verifyPayment(params: VerifyPaymentParams, customerId: string): Promise<{
        booking: any;
        payment: IPayment;
    }>;
    /**
     * Gets payment record details for a specific booking.
     */
    static getPaymentByBooking(bookingId: string, customerId: string): Promise<IPayment | null>;
    /**
     * Retrieves public Razorpay config for client SDK setup.
     */
    static getPublicConfig(): {
        keyId: string;
        isConfigured: boolean;
        currency: string;
    };
}
//# sourceMappingURL=payment.service.d.ts.map