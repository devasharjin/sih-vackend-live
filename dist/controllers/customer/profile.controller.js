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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerProfile = getCustomerProfile;
exports.updateCustomerProfile = updateCustomerProfile;
exports.updatePrimaryAddress = updatePrimaryAddress;
exports.addSavedAddress = addSavedAddress;
exports.updateSavedAddress = updateSavedAddress;
exports.deleteSavedAddress = deleteSavedAddress;
exports.setDefaultAddress = setDefaultAddress;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../../models/auth/user.model"));
const booking_model_1 = __importStar(require("../../models/booking.model"));
const envelope_1 = require("../../shared/envelope");
/**
 * Helper to extract authenticated user's ID from req.user
 */
function getAuthUserId(req) {
    const user = req.user;
    return user?.userId || user?._id || user?.id || null;
}
/**
 * GET /api/customer/profile
 * Retrieves user profile details, addresses, and customer booking activity metrics
 */
async function getCustomerProfile(req, res) {
    const userId = getAuthUserId(req);
    if (!userId) {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const user = await user_model_1.default.findById(userId).select("-password").lean();
    if (!user) {
        return (0, envelope_1.fail)(res, "User profile not found", null, 404);
    }
    // Aggregate customer booking metrics
    const customerObjectId = new mongoose_1.default.Types.ObjectId(userId);
    const [totalBookings, activeBookings, completedBookings, cancelledBookings] = await Promise.all([
        booking_model_1.default.countDocuments({ customer: customerObjectId }),
        booking_model_1.default.countDocuments({
            customer: customerObjectId,
            status: {
                $in: [
                    booking_model_1.BookingStatus.PENDING,
                    booking_model_1.BookingStatus.ASSIGNED,
                    booking_model_1.BookingStatus.CONFIRMED,
                    booking_model_1.BookingStatus.IN_PROGRESS,
                ],
            },
        }),
        booking_model_1.default.countDocuments({
            customer: customerObjectId,
            status: booking_model_1.BookingStatus.COMPLETED,
        }),
        booking_model_1.default.countDocuments({
            customer: customerObjectId,
            status: {
                $in: [booking_model_1.BookingStatus.CANCELLED, booking_model_1.BookingStatus.REJECTED],
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
    return (0, envelope_1.ok)(res, {
        user,
        address: user.address || null,
        savedAddresses: user.savedAddresses || [],
        stats,
    }, "Customer profile retrieved successfully");
}
/**
 * PATCH /api/customer/profile
 * Updates basic customer personal details (name, phone, profilePicture)
 */
async function updateCustomerProfile(req, res) {
    const userId = getAuthUserId(req);
    if (!userId) {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const { name, phone, profilePicture } = req.body;
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        return (0, envelope_1.fail)(res, "User not found", null, 404);
    }
    if (name !== undefined) {
        const trimmedName = String(name).trim();
        if (trimmedName.length < 2) {
            return (0, envelope_1.fail)(res, "Name must contain at least 2 characters", null, 400);
        }
        user.name = trimmedName;
    }
    if (phone !== undefined) {
        const trimmedPhone = String(phone).trim();
        if (!trimmedPhone) {
            return (0, envelope_1.fail)(res, "Phone number cannot be empty", null, 400);
        }
        user.phone = trimmedPhone;
    }
    if (profilePicture !== undefined) {
        user.profilePicture = String(profilePicture).trim();
    }
    await user.save();
    const sanitizedUser = await user_model_1.default.findById(userId).select("-password").lean();
    return (0, envelope_1.ok)(res, { user: sanitizedUser }, "Customer personal details updated successfully");
}
/**
 * PATCH /api/customer/profile/address
 * Updates customer's primary address
 */
async function updatePrimaryAddress(req, res) {
    const userId = getAuthUserId(req);
    if (!userId) {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const { street, city, state, zip, country, landmark } = req.body;
    if (!street || !String(street).trim()) {
        return (0, envelope_1.fail)(res, "Street address is required", null, 400);
    }
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        return (0, envelope_1.fail)(res, "User not found", null, 404);
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
    return (0, envelope_1.ok)(res, {
        address: user.address,
        savedAddresses: user.savedAddresses || [],
    }, "Primary address updated successfully");
}
/**
 * POST /api/customer/profile/addresses
 * Adds a new address to customer's savedAddresses
 */
async function addSavedAddress(req, res) {
    const userId = getAuthUserId(req);
    if (!userId) {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const { title = "Home", street, city, state, zip, country, landmark, isDefault } = req.body;
    if (!street || !String(street).trim()) {
        return (0, envelope_1.fail)(res, "Street address is required", null, 400);
    }
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        return (0, envelope_1.fail)(res, "User not found", null, 404);
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
    return (0, envelope_1.ok)(res, {
        address: user.address,
        savedAddresses: user.savedAddresses,
    }, "Address added successfully");
}
/**
 * PATCH /api/customer/profile/addresses/:addressId
 * Updates an existing address in customer's savedAddresses
 */
async function updateSavedAddress(req, res) {
    const userId = getAuthUserId(req);
    if (!userId) {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const { addressId } = req.params;
    const { title, street, city, state, zip, country, landmark, isDefault } = req.body;
    if (!addressId) {
        return (0, envelope_1.fail)(res, "Address ID is required", null, 400);
    }
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        return (0, envelope_1.fail)(res, "User not found", null, 404);
    }
    const addressItem = user.savedAddresses?.find((a) => a._id?.toString() === addressId);
    if (!addressItem) {
        return (0, envelope_1.fail)(res, "Saved address not found", null, 404);
    }
    if (title !== undefined)
        addressItem.title = String(title).trim() || "Home";
    if (street !== undefined) {
        const trimmed = String(street).trim();
        if (!trimmed)
            return (0, envelope_1.fail)(res, "Street cannot be empty", null, 400);
        addressItem.street = trimmed;
    }
    if (city !== undefined)
        addressItem.city = String(city).trim();
    if (state !== undefined)
        addressItem.state = String(state).trim();
    if (zip !== undefined)
        addressItem.zip = String(zip).trim();
    if (country !== undefined)
        addressItem.country = String(country).trim() || "India";
    if (landmark !== undefined)
        addressItem.landmark = String(landmark).trim();
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
    return (0, envelope_1.ok)(res, {
        address: user.address,
        savedAddresses: user.savedAddresses,
    }, "Address updated successfully");
}
/**
 * DELETE /api/customer/profile/addresses/:addressId
 * Deletes a saved address by its ID
 */
async function deleteSavedAddress(req, res) {
    const userId = getAuthUserId(req);
    if (!userId) {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const { addressId } = req.params;
    if (!addressId) {
        return (0, envelope_1.fail)(res, "Address ID is required", null, 400);
    }
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        return (0, envelope_1.fail)(res, "User not found", null, 404);
    }
    const initialCount = user.savedAddresses?.length || 0;
    user.savedAddresses = (user.savedAddresses || []).filter((a) => a._id?.toString() !== addressId);
    if (user.savedAddresses.length === initialCount) {
        return (0, envelope_1.fail)(res, "Address not found", null, 404);
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
    return (0, envelope_1.ok)(res, {
        address: user.address,
        savedAddresses: user.savedAddresses,
    }, "Address removed successfully");
}
/**
 * PATCH /api/customer/profile/addresses/:addressId/default
 * Sets a specific address as default and syncs it with primary address
 */
async function setDefaultAddress(req, res) {
    const userId = getAuthUserId(req);
    if (!userId) {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const { addressId } = req.params;
    if (!addressId) {
        return (0, envelope_1.fail)(res, "Address ID is required", null, 400);
    }
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        return (0, envelope_1.fail)(res, "User not found", null, 404);
    }
    const targetAddress = user.savedAddresses?.find((a) => a._id?.toString() === addressId);
    if (!targetAddress) {
        return (0, envelope_1.fail)(res, "Saved address not found", null, 404);
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
    return (0, envelope_1.ok)(res, {
        address: user.address,
        savedAddresses: user.savedAddresses,
    }, "Default address updated successfully");
}
//# sourceMappingURL=profile.controller.js.map