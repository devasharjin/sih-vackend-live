import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import User, { UserRole } from "../../../models/auth/user.model";
import Worker, {
  AvailabilityStatus,
  VerificationStatus,
} from "../../../models/auth/worker.model";
import Category from "../../../models/category.model";
import Service from "../../../models/service.model";
import { fail, ok } from "../../../shared/envelope";
import { generateAuthTokens } from "../../../utils/jwt.utils";
import { setAuthCookies } from "../../../utils/cookie.utils";
import { uploadToCloudinary } from "../../../services/cloudinaryservices";

export const workerRegister = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // 1. Check user authentication
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized. Please log in first.", null, 401);
  }

  const userId = req.user.id || (req.user as any).userId;

  // 2. Check if worker profile already exists for this user
  const existingWorker = await Worker.findOne({ userId });
  if (existingWorker) {
    return fail(
      res,
      "Worker profile already exists for this account.",
      null,
      409
    );
  }

  // 3. Extract request body fields (support JSON or multipart/form-data)
  let {
    cooperativeId,
    category,
    categoryId,
    categories,
    categoryIds,
    skills,
    availability,
    experience,
    yearsOfExperience,
    location,
    address,
    city,
    state,
    pincode,
    latitude,
    longitude,
  } = req.body;

  // Extract raw category inputs
  let rawCategories: any[] = [];
  const primaryCat = categoryId || category;
  if (primaryCat) {
    rawCategories.push(primaryCat);
  }
  const multiCat = categoryIds || categories;
  if (multiCat) {
    if (typeof multiCat === "string") {
      try {
        const parsed = JSON.parse(multiCat);
        if (Array.isArray(parsed)) rawCategories.push(...parsed);
        else rawCategories.push(multiCat);
      } catch {
        rawCategories.push(
          ...multiCat.split(",").map((c: string) => c.trim()).filter(Boolean)
        );
      }
    } else if (Array.isArray(multiCat)) {
      rawCategories.push(...multiCat);
    }
  }

  // Parse legacy skills if passed
  let skillList: any[] = [];
  if (typeof skills === "string") {
    try {
      skillList = JSON.parse(skills);
    } catch {
      skillList = skills.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  } else if (Array.isArray(skills)) {
    skillList = skills;
  }

  // Support direct trade services / skills
  let directServiceInputs: any[] = [];
  const rawDirect = req.body.services || req.body.serviceIds || req.body.trades;
  if (rawDirect) {
    if (typeof rawDirect === "string") {
      try {
        const parsed = JSON.parse(rawDirect);
        if (Array.isArray(parsed)) directServiceInputs.push(...parsed);
        else directServiceInputs.push(rawDirect);
      } catch {
        directServiceInputs.push(
          ...rawDirect.split(",").map((s: string) => s.trim()).filter(Boolean)
        );
      }
    } else if (Array.isArray(rawDirect)) {
      directServiceInputs.push(...rawDirect);
    }
  }

  // Resolve valid Categories (for backwards compatibility if passed)
  let validCategoryObjectIds: Types.ObjectId[] = [];
  const candidateCatIds = [...new Set(rawCategories)]
    .map((c) => (typeof c === "object" && c?._id ? String(c._id) : String(c).trim()))
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (candidateCatIds.length > 0) {
    const existingCats = await Category.find({
      _id: { $in: candidateCatIds.map((id) => new Types.ObjectId(id)) },
    }).select("_id name");
    validCategoryObjectIds = existingCats.map((c) => c._id as Types.ObjectId);
  }

  // Resolve candidate skills from direct service inputs or skillList
  const allCandidateSkillIds = [
    ...new Set([
      ...directServiceInputs.map((s) => (typeof s === "object" && s?._id ? String(s._id) : String(s).trim())),
      ...skillList.map((s) => (typeof s === "object" && s?._id ? String(s._id) : String(s).trim())),
    ]),
  ].filter((id) => mongoose.Types.ObjectId.isValid(id));

  let resolvedServices = [];
  if (allCandidateSkillIds.length > 0) {
    resolvedServices = await Service.find({
      _id: { $in: allCandidateSkillIds.map((id) => new Types.ObjectId(id)) },
      isActive: true,
    }).select("_id category");
  }

  // Also include category services if category was provided
  if (validCategoryObjectIds.length > 0) {
    const categoryServices = await Service.find({
      category: { $in: validCategoryObjectIds },
      isActive: true,
    }).select("_id");
    resolvedServices.push(...categoryServices);
  }

  const skillObjectIds: Types.ObjectId[] = [
    ...new Set(resolvedServices.map((s) => s._id.toString())),
  ].map((id) => new Types.ObjectId(id));

  if (skillObjectIds.length === 0 && validCategoryObjectIds.length === 0) {
    return fail(
      res,
      "Please select at least one trade service (e.g. Plumber, Electrician, Gardener).",
      null,
      400
    );
  }

  // Parse availability
  if (
    availability &&
    !Object.values(AvailabilityStatus).includes(availability as AvailabilityStatus)
  ) {
    return fail(
      res,
      `Invalid availability status. Must be one of: ${Object.values(
        AvailabilityStatus
      ).join(", ")}`,
      null,
      400
    );
  }
  const workerAvailability =
    (availability as AvailabilityStatus) || AvailabilityStatus.FULL_TIME;

  // Parse experience
  const rawExp = experience !== undefined ? experience : yearsOfExperience;
  const parsedExperience = Number(rawExp);
  if (isNaN(parsedExperience) || parsedExperience < 0) {
    return fail(
      res,
      "Experience must be a valid non-negative number.",
      null,
      400
    );
  }

  // Parse location
  let parsedLocation: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
  } = {
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: 0,
    longitude: 0,
  };

  if (typeof location === "string") {
    try {
      parsedLocation = { ...parsedLocation, ...JSON.parse(location) };
    } catch {
      // Fallback
    }
  } else if (typeof location === "object" && location !== null) {
    parsedLocation = { ...parsedLocation, ...location };
  }

  // Fallback to top-level fields
  if (!parsedLocation.address && address) parsedLocation.address = String(address).trim();
  if (!parsedLocation.city && city) parsedLocation.city = String(city).trim();
  if (!parsedLocation.state && state) parsedLocation.state = String(state).trim();
  if (!parsedLocation.pincode && pincode) parsedLocation.pincode = String(pincode).trim();
  if (latitude !== undefined) parsedLocation.latitude = Number(latitude) || 0;
  if (longitude !== undefined) parsedLocation.longitude = Number(longitude) || 0;

  if (
    !parsedLocation.address ||
    !parsedLocation.city ||
    !parsedLocation.state ||
    !parsedLocation.pincode
  ) {
    return fail(
      res,
      "Complete location details (address, city, state, pincode) are required.",
      null,
      400
    );
  }

  // Validate cooperativeId (mandatory - independent worker is not permitted)
  if (
    !cooperativeId ||
    typeof cooperativeId !== "string" ||
    cooperativeId === "none" ||
    cooperativeId === "null" ||
    !cooperativeId.trim()
  ) {
    return fail(
      res,
      "Cooperative society selection is mandatory. You must choose an affiliated cooperative.",
      null,
      400
    );
  }

  if (!mongoose.Types.ObjectId.isValid(cooperativeId.trim())) {
    return fail(res, "Invalid cooperative ID selected.", null, 400);
  }

  const validCoopId = new Types.ObjectId(cooperativeId.trim());

  // 4. Handle verification documents (identity & certificate)
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

  const identityFile = files?.identity?.[0];
  const certificateFile = files?.certificate?.[0];

  let identityUrl: string = req.body.identityUrl || "";
  let certificateUrl: string = req.body.certificateUrl || "";

  // Upload verification documents concurrently for maximum performance
  try {
    const [identityUploadRes, certUploadRes] = await Promise.all([
      identityFile
        ? uploadToCloudinary(identityFile, {
            folder: "workers/identity",
          })
        : null,
      certificateFile
        ? uploadToCloudinary(certificateFile, {
            folder: "workers/certificates",
          })
        : null,
    ]);

    if (identityUploadRes) {
      identityUrl = identityUploadRes.secure_url;
    }
    if (certUploadRes) {
      certificateUrl = certUploadRes.secure_url;
    }
  } catch (err: any) {
    return fail(
      res,
      `Verification document upload failed: ${err?.message || "Cloud error"}`,
      null,
      500
    );
  }

  // Ensure both verification documents are present
  if (!identityUrl) {
    return fail(
      res,
      "Identity verification document is required (e.g. Aadhaar, Passport, or Government ID).",
      null,
      400
    );
  }

  if (!certificateUrl) {
    return fail(
      res,
      "Professional trade certificate is required (e.g. ITI, Diploma, or Trade Certificate).",
      null,
      400
    );
  }

  // 5. Create Worker document
  const worker: any = await Worker.create({
    userId,
    cooperativeId: validCoopId,
    category: validCategoryObjectIds[0] || undefined,
    categories: validCategoryObjectIds.length > 0 ? validCategoryObjectIds : undefined,
    skills: skillObjectIds,
    availability: workerAvailability,
    verificationStatus: VerificationStatus.PENDING,
    verificationDocuments: {
      identity: {
        url: identityUrl,
        status: VerificationStatus.PENDING,
      },
      certificate: {
        url: certificateUrl,
        status: VerificationStatus.PENDING,
      },
    },
    experience: parsedExperience,
    location: {
      address: parsedLocation.address,
      city: parsedLocation.city,
      state: parsedLocation.state,
      pincode: parsedLocation.pincode,
      latitude: parsedLocation.latitude ?? 0,
      longitude: parsedLocation.longitude ?? 0,
    },
    rating: 0,
    totalJobsCompleted: 0,
    isActive: true,
  });

  // 6. Update User role
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { role: UserRole.WORKER } },
    { new: true }
  );

  // 7. Re-issue JWT tokens with updated role
  let tokens;
  if (updatedUser) {
    tokens = generateAuthTokens(updatedUser);
    setAuthCookies(res, tokens);
  }

  const populatedWorker = await Worker.findById(worker._id)
    .populate("category", "name icon slug description")
    .populate("categories", "name icon slug description")
    .populate("skills", "name description category priceType hourlyPrice metersPrice")
    .populate("cooperativeId", "cooperativeName cooperativeAddress");

  return ok(
    res,
    { worker: populatedWorker || worker, user: updatedUser, tokens },
    "Worker registration submitted successfully! Your profile is pending verification."
  );
};