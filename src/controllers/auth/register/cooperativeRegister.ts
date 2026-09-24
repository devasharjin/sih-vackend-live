import { Request, Response } from "express";
import mongoose from "mongoose";
import User, { UserRole } from "../../../models/auth/user.model";
import Cooperative from "../../../models/auth/cooperative.model";
import { VerificationStatus } from "../../../models/auth/worker.model";
import { fail, ok } from "../../../shared/envelope";
import { generateAuthTokens } from "../../../utils/jwt.utils";
import { setAuthCookies } from "../../../utils/cookie.utils";
import { uploadToCloudinary } from "../../../services/cloudinaryservices";

export const cooperativeRegister = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // 1. User ID attached by authentication middleware
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized. Please log in first.", null, 401);
  }

  const userId = req.user.id || (req.user as any).userId;

  // 2. Check if cooperative profile already exists for this user
  const existingCooperative = await Cooperative.findOne({ userId });
  if (existingCooperative) {
    return fail(
      res,
      "Cooperative profile already exists for this user",
      null,
      409
    );
  }

  const {
    cooperativeName,
    cooperativeAddress,
    cooperativePhone,
    cooperativeEmail,
  } = req.body;

  // 3. Validate required text fields
  if (!cooperativeName || typeof cooperativeName !== "string" || !cooperativeName.trim()) {
    return fail(res, "Cooperative legal name is required", null, 400);
  }

  if (!cooperativeAddress || typeof cooperativeAddress !== "string" || !cooperativeAddress.trim()) {
    return fail(res, "Cooperative registered address is required", null, 400);
  }

  if (!cooperativePhone || typeof cooperativePhone !== "string" || !cooperativePhone.trim()) {
    return fail(res, "Cooperative contact phone number is required", null, 400);
  }

  if (!cooperativeEmail || typeof cooperativeEmail !== "string" || !cooperativeEmail.trim()) {
    return fail(res, "Cooperative official email is required", null, 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cooperativeEmail.trim())) {
    return fail(res, "Invalid cooperative email format", null, 400);
  }


  // 4. Handle file uploads (cooperativeLogo & verificationCertificate)
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

  const logoFile = files?.cooperativeLogo?.[0];
  const certificateFile = files?.verificationCertificate?.[0];

  let logoData: { url: string; publicId: string } | null = null;
  let certificateData: { url: string; publicId: string } | null = null;

  // Upload logo and certificate concurrently for maximum performance
  try {
    const [logoUploadRes, certUploadRes] = await Promise.all([
      logoFile
        ? uploadToCloudinary(logoFile, {
            folder: "cooperatives/logos",
          })
        : null,
      certificateFile
        ? uploadToCloudinary(certificateFile, {
            folder: "cooperatives/certificates",
          })
        : null,
    ]);

    if (logoUploadRes) {
      logoData = {
        url: logoUploadRes.secure_url,
        publicId: logoUploadRes.public_id,
      };
    } else if (req.body.cooperativeLogoUrl) {
      logoData = {
        url: req.body.cooperativeLogoUrl,
        publicId: req.body.cooperativeLogoPublicId || `coop_logo_${Date.now()}`,
      };
    }

    if (certUploadRes) {
      certificateData = {
        url: certUploadRes.secure_url,
        publicId: certUploadRes.public_id,
      };
    } else if (req.body.verificationCertificateUrl) {
      certificateData = {
        url: req.body.verificationCertificateUrl,
        publicId: req.body.verificationCertificatePublicId || `coop_cert_${Date.now()}`,
      };
    }
  } catch (err: any) {
    return fail(
      res,
      `Document upload failed: ${err?.message || "Cloud error"}`,
      null,
      500
    );
  }

  // Ensure both verification documents are present
  if (!logoData || !logoData.url) {
    return fail(
      res,
      "Cooperative society logo is required (JPG, PNG, or WebP).",
      null,
      400
    );
  }

  if (!certificateData || !certificateData.url) {
    return fail(
      res,
      "Official cooperative registration certificate or bylaws document is required (PDF, JPG, PNG).",
      null,
      400
    );
  }

  // 5. Create cooperative profile
  const cooperative = await Cooperative.create({
    userId,
    cooperativeName: cooperativeName.trim(),
    cooperativeAddress: cooperativeAddress.trim(),
    cooperativePhone: cooperativePhone.trim(),
    cooperativeEmail: cooperativeEmail.trim().toLowerCase(),
    cooperativeLogo: logoData,
    verificationCertificate: certificateData,
    verificationStatus: VerificationStatus.PENDING,
  });

  // 6. Add COOPERATIVE role to user's role array and retrieve updated user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { role: UserRole.COOPERATIVE } },
    { new: true }
  );

  let tokens;
  if (updatedUser) {
    tokens = generateAuthTokens(updatedUser);
    setAuthCookies(res, tokens);
  }

  return ok(
    res,
    { cooperative, user: updatedUser, tokens },
    "Cooperative registration submitted successfully for verification"
  );
};
