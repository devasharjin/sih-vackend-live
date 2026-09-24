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
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitContactMessage = submitContactMessage;
const contact_model_1 = __importStar(require("../../models/contact.model"));
const envelope_1 = require("../../shared/envelope");
async function submitContactMessage(req, res) {
    const { name, email, phone, category, subject, message } = req.body;
    if (!name || !String(name).trim()) {
        return (0, envelope_1.fail)(res, "Full name is required", null, 400);
    }
    if (!email || !String(email).trim()) {
        return (0, envelope_1.fail)(res, "Email address is required", null, 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
        return (0, envelope_1.fail)(res, "Please provide a valid email address", null, 400);
    }
    if (!subject || !String(subject).trim()) {
        return (0, envelope_1.fail)(res, "Subject is required", null, 400);
    }
    if (!message || !String(message).trim()) {
        return (0, envelope_1.fail)(res, "Message is required", null, 400);
    }
    const validCategory = Object.values(contact_model_1.InquiryCategory).includes(category)
        ? category
        : contact_model_1.InquiryCategory.GENERAL_INQUIRY;
    const authUserId = req.user?.userId || req.user?._id || req.user?.id;
    const contactEntry = await contact_model_1.default.create({
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : "",
        category: validCategory,
        subject: String(subject).trim(),
        message: String(message).trim(),
        user: authUserId || undefined,
    });
    return (0, envelope_1.ok)(res, {
        ticketNumber: contactEntry.ticketNumber,
        createdAt: contactEntry.createdAt,
    }, "Your message has been received! Our cooperative support team will contact you shortly.");
}
//# sourceMappingURL=contact.controller.js.map