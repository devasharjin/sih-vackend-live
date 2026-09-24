"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRazorpayInstance = exports.isRazorpayConfigured = exports.RAZORPAY_KEY_SECRET = exports.RAZORPAY_KEY_ID = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ quiet: true });
exports.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
exports.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const isRazorpayConfigured = () => {
    return Boolean(exports.RAZORPAY_KEY_ID &&
        exports.RAZORPAY_KEY_SECRET &&
        !exports.RAZORPAY_KEY_ID.includes("your_key_id"));
};
exports.isRazorpayConfigured = isRazorpayConfigured;
let razorpayInstance = null;
const getRazorpayInstance = () => {
    if (!(0, exports.isRazorpayConfigured)()) {
        return null;
    }
    if (!razorpayInstance) {
        razorpayInstance = new razorpay_1.default({
            key_id: exports.RAZORPAY_KEY_ID,
            key_secret: exports.RAZORPAY_KEY_SECRET,
        });
    }
    return razorpayInstance;
};
exports.getRazorpayInstance = getRazorpayInstance;
//# sourceMappingURL=razorpay.config.js.map