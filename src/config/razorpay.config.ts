import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

export const isRazorpayConfigured = (): boolean => {
  return Boolean(
    RAZORPAY_KEY_ID &&
      RAZORPAY_KEY_SECRET &&
      !RAZORPAY_KEY_ID.includes("your_key_id")
  );
};

let razorpayInstance: Razorpay | null = null;

export const getRazorpayInstance = (): Razorpay | null => {
  if (!isRazorpayConfigured()) {
    return null;
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }

  return razorpayInstance;
};
