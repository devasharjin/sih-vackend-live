import { Request, Response } from "express";
import mongoose from "mongoose";
import User, { IAddress, ISavedAddress } from "../../models/auth/user.model";
import Booking, { BookingStatus } from "../../models/booking.model";
import { fail, ok } from "../../shared/envelope";

/**
 * Helper to extract authenticated user's ID from req.user
 */
function getAuthUserId(req: Request): string | null {
  const user = req.user as any;
  return user?.userId || user?._id || user?.id || null;
}

/**
 * GET /api/customer/profile
 * Retrieves user profile details, addresses, and customer booking activity metrics
 */
export async function getCustomerProfile(req: Request, res: Response) {
  const userId = getAuthUserId(req);
  if (!userId) {
    return fail(res, "Unauthorized", null, 401);
  }

  const user = await User.findById(userId).select("-password").lean();
  if (!user) {
    return fail(res, "User profile not found", null, 404);
  }

  // Aggregate customer booking metrics
  const customerObjectId = new mongoose.Types.ObjectId(userId);
  const [totalBookings, activeBookings, completedBookings, cancelledBookings] =
    await Promise.all([
      Booking.countDocuments({ customer: customerObjectId }),
      Booking.countDocuments({
        customer: customerObjectId,
        status: {
          $in: [
            BookingStatus.PENDING,
            BookingStatus.ASSIGNED,
            BookingStatus.CONFIRMED,
            BookingStatus.IN_PROGRESS,
          ],
        },
      }),
      Booking.countDocuments({
        customer: customerObjectId,
        status: BookingStatus.COMPLETED,
      }),
      Booking.countDocuments({
        customer: customerObjectId,
        status: {
          $in: [BookingStatus.CANCELLED, BookingStatus.REJECTED],
        },
      }),
    ]);

  const stats = {
    totalBookings,
    activeBookings,
    completedBookings,
    cancelledBookings,
    totalSavedAddresses: user.savedAddresses?.length || 0,
  };

  return ok(
    res,
    {
      user,
      address: user.address || null,
      savedAddresses: user.savedAddresses || [],
      stats,
    },
    "Customer profile retrieved successfully"
  );
}

/**
 * PATCH /api/customer/profile
 * Updates basic customer personal details (name, phone, profilePicture)
 */
export async function updateCustomerProfile(req: Request, res: Response) {
  const userId = getAuthUserId(req);
  if (!userId) {
    return fail(res, "Unauthorized", null, 401);
  }

  const { name, phone, profilePicture } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return fail(res, "User not found", null, 404);
  }

  if (name !== undefined) {
    const trimmedName = String(name).trim();
    if (trimmedName.length < 2) {
      return fail(res, "Name must contain at least 2 characters", null, 400);
    }
    user.name = trimmedName;
  }

  if (phone !== undefined) {
    const trimmedPhone = String(phone).trim();
    if (!trimmedPhone) {
      return fail(res, "Phone number cannot be empty", null, 400);
    }
    user.phone = trimmedPhone;
  }

  if (profilePicture !== undefined) {
    user.profilePicture = String(profilePicture).trim();
  }

  await user.save();

  const sanitizedUser = await User.findById(userId).select("-password").lean();

  return ok(
    res,
    { user: sanitizedUser },
    "Customer personal details updated successfully"
  );
}

/**
 * PATCH /api/customer/profile/address
 * Updates customer's primary address
 */
export async function updatePrimaryAddress(req: Request, res: Response) {
  const userId = getAuthUserId(req);
  if (!userId) {
    return fail(res, "Unauthorized", null, 401);
  }

  const { street, city, state, zip, country, landmark } = req.body;

  if (!street || !String(street).trim()) {
    return fail(res, "Street address is required", null, 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    return fail(res, "User not found", null, 404);
  }

  user.address = {
    street: String(street).trim(),
    city: city ? String(city).trim() : "",
    state: state ? String(state).trim() : "",
    zip: zip ? String(zip).trim() : "",
    country: country ? String(country).trim() : "India",
    landmark: landmark ? String(landmark).trim() : "",
  };

  await user.save();

  return ok(
    res,
    {
      address: user.address,
      savedAddresses: user.savedAddresses || [],
    },
    "Primary address updated successfully"
  );
}

/**
 * POST /api/customer/profile/addresses
 * Adds a new address to customer's savedAddresses
 */
export async function addSavedAddress(req: Request, res: Response) {
  const userId = getAuthUserId(req);
  if (!userId) {
    return fail(res, "Unauthorized", null, 401);
  }

  const { title = "Home", street, city, state, zip, country, landmark, isDefault } =
    req.body;

  if (!street || !String(street).trim()) {
    return fail(res, "Street address is required", null, 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    return fail(res, "User not found", null, 404);
  }

  if (!user.savedAddresses) {
    user.savedAddresses = [];
  }

  const shouldBeDefault = Boolean(isDefault) || user.savedAddresses.length === 0;

  // If new address is marked default, unset default on all other saved addresses
  if (shouldBeDefault) {
    user.savedAddresses.forEach((addr) => {
      addr.isDefault = false;
    });

    // Also sync primary address
    user.address = {
      street: String(street).trim(),
      city: city ? String(city).trim() : "",
      state: state ? String(state).trim() : "",
      zip: zip ? String(zip).trim() : "",
      country: country ? String(country).trim() : "India",
      landmark: landmark ? String(landmark).trim() : "",
    };
  }

  const newAddress = {
    title: String(title).trim() || "Home",
    street: String(street).trim(),
    city: city ? String(city).trim() : "",
    state: state ? String(state).trim() : "",
    zip: zip ? String(zip).trim() : "",
    country: country ? String(country).trim() : "India",
    landmark: landmark ? String(landmark).trim() : "",
    isDefault: shouldBeDefault,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  user.savedAddresses.push(newAddress);
  await user.save();

  return ok(
    res,
    {
      address: user.address,
      savedAddresses: user.savedAddresses,
    },
    "Address added successfully"
  );
}

/**
 * PATCH /api/customer/profile/addresses/:addressId
 * Updates an existing address in customer's savedAddresses
 */
export async function updateSavedAddress(req: Request, res: Response) {
  const userId = getAuthUserId(req);
  if (!userId) {
    return fail(res, "Unauthorized", null, 401);
  }

  const { addressId } = req.params;
  const { title, street, city, state, zip, country, landmark, isDefault } =
    req.body;

  if (!addressId) {
    return fail(res, "Address ID is required", null, 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    return fail(res, "User not found", null, 404);
  }

  const addressItem = user.savedAddresses?.find(
    (a) => a._id?.toString() === addressId
  );

  if (!addressItem) {
    return fail(res, "Saved address not found", null, 404);
  }

  if (title !== undefined) addressItem.title = String(title).trim() || "Home";
  if (street !== undefined) {
    const trimmed = String(street).trim();
    if (!trimmed) return fail(res, "Street cannot be empty", null, 400);
    addressItem.street = trimmed;
  }
  if (city !== undefined) addressItem.city = String(city).trim();
  if (state !== undefined) addressItem.state = String(state).trim();
  if (zip !== undefined) addressItem.zip = String(zip).trim();
  if (country !== undefined) addressItem.country = String(country).trim() || "India";
  if (landmark !== undefined) addressItem.landmark = String(landmark).trim();

  if (isDefault) {
    user.savedAddresses?.forEach((a) => {
      a.isDefault = a._id?.toString() === addressId;
    });

    user.address = {
      street: addressItem.street,
      city: addressItem.city,
      state: addressItem.state,
      zip: addressItem.zip,
      country: addressItem.country,
      landmark: addressItem.landmark,
    };
  }

  addressItem.updatedAt = new Date();
  await user.save();

  return ok(
    res,
    {
      address: user.address,
      savedAddresses: user.savedAddresses,
    },
    "Address updated successfully"
  );
}

/**
 * DELETE /api/customer/profile/addresses/:addressId
 * Deletes a saved address by its ID
 */
export async function deleteSavedAddress(req: Request, res: Response) {
  const userId = getAuthUserId(req);
  if (!userId) {
    return fail(res, "Unauthorized", null, 401);
  }

  const { addressId } = req.params;
  if (!addressId) {
    return fail(res, "Address ID is required", null, 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    return fail(res, "User not found", null, 404);
  }

  const initialCount = user.savedAddresses?.length || 0;
  user.savedAddresses = (user.savedAddresses || []).filter(
    (a) => a._id?.toString() !== addressId
  );

  if (user.savedAddresses.length === initialCount) {
    return fail(res, "Address not found", null, 404);
  }

  // If the deleted address was default, set another address as default if available
  const hasDefault = user.savedAddresses.some((a) => a.isDefault);
  if (!hasDefault && user.savedAddresses.length > 0) {
    user.savedAddresses[0].isDefault = true;
    user.address = {
      street: user.savedAddresses[0].street,
      city: user.savedAddresses[0].city,
      state: user.savedAddresses[0].state,
      zip: user.savedAddresses[0].zip,
      country: user.savedAddresses[0].country,
      landmark: user.savedAddresses[0].landmark,
    };
  }

  await user.save();

  return ok(
    res,
    {
      address: user.address,
      savedAddresses: user.savedAddresses,
    },
    "Address removed successfully"
  );
}

/**
 * PATCH /api/customer/profile/addresses/:addressId/default
 * Sets a specific address as default and syncs it with primary address
 */
export async function setDefaultAddress(req: Request, res: Response) {
  const userId = getAuthUserId(req);
  if (!userId) {
    return fail(res, "Unauthorized", null, 401);
  }

  const { addressId } = req.params;
  if (!addressId) {
    return fail(res, "Address ID is required", null, 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    return fail(res, "User not found", null, 404);
  }

  const targetAddress = user.savedAddresses?.find(
    (a) => a._id?.toString() === addressId
  );

  if (!targetAddress) {
    return fail(res, "Saved address not found", null, 404);
  }

  user.savedAddresses?.forEach((a) => {
    a.isDefault = a._id?.toString() === addressId;
  });

  user.address = {
    street: targetAddress.street,
    city: targetAddress.city,
    state: targetAddress.state,
    zip: targetAddress.zip,
    country: targetAddress.country,
    landmark: targetAddress.landmark,
  };

  await user.save();

  return ok(
    res,
    {
      address: user.address,
      savedAddresses: user.savedAddresses,
    },
    "Default address updated successfully"
  );
}
