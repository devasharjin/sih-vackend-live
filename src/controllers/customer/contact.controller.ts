import { Request, Response } from "express";
import ContactMessage, {
  InquiryCategory,
} from "../../models/contact.model";
import { fail, ok } from "../../shared/envelope";

export async function submitContactMessage(req: Request, res: Response) {
  const { name, email, phone, category, subject, message } = req.body;

  if (!name || !String(name).trim()) {
    return fail(res, "Full name is required", null, 400);
  }

  if (!email || !String(email).trim()) {
    return fail(res, "Email address is required", null, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email).trim())) {
    return fail(res, "Please provide a valid email address", null, 400);
  }

  if (!subject || !String(subject).trim()) {
    return fail(res, "Subject is required", null, 400);
  }

  if (!message || !String(message).trim()) {
    return fail(res, "Message is required", null, 400);
  }

  const validCategory = Object.values(InquiryCategory).includes(category)
    ? category
    : InquiryCategory.GENERAL_INQUIRY;

  const authUserId = (req.user as any)?.userId || (req.user as any)?._id || (req.user as any)?.id;

  const contactEntry = await ContactMessage.create({
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: phone ? String(phone).trim() : "",
    category: validCategory,
    subject: String(subject).trim(),
    message: String(message).trim(),
    user: authUserId || undefined,
  });

  return ok(
    res,
    {
      ticketNumber: contactEntry.ticketNumber,
      createdAt: contactEntry.createdAt,
    },
    "Your message has been received! Our cooperative support team will contact you shortly."
  );
}
