import { Request, Response } from "express";
import mongoose from "mongoose";
import User, { UserRole, AccountStatus } from "../../models/auth/user.model";
import Worker from "../../models/auth/worker.model";
import Cooperative from "../../models/auth/cooperative.model";
import Booking from "../../models/booking.model";
import { fail, ok } from "../../shared/envelope";

/**
 * Get paginated, searchable list of users with role and status filters
 */
export async function getAdminUsers(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 15));
    const skip = (page - 1) * limit;

    const role = (req.query.role as string)?.trim().toUpperCase();
    const status = (req.query.status as string)?.trim().toUpperCase();
    const search = (req.query.search as string)?.trim();

    const query: any = {};

    if (role && role !== "ALL" && Object.values(UserRole).includes(role as UserRole)) {
      query.role = role;
    }

    if (status && status !== "ALL" && Object.values(AccountStatus).includes(status as AccountStatus)) {
      query.accountStatus = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return ok(
      res,
      {
        users,
        total,
        page,
        limit,
        totalPages,
      },
      "Users retrieved successfully"
    );
  } catch (error: any) {
    console.error("Failed to retrieve users:", error);
    return fail(res, error.message || "Failed to retrieve users", null, 500);
  }
}

/**
 * Get aggregated user count metrics by role and account status
 */
export async function getAdminUserStats(req: Request, res: Response) {
  try {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      customerCount,
      workerCount,
      cooperativeCount,
      superAdminCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountStatus: AccountStatus.ACTIVE }),
      User.countDocuments({ accountStatus: AccountStatus.SUSPEND }),
      User.countDocuments({ role: UserRole.CUSTOMER }),
      User.countDocuments({ role: UserRole.WORKER }),
      User.countDocuments({ role: UserRole.COOPERATIVE }),
      User.countDocuments({ role: UserRole.SUPERADMIN }),
    ]);

    return ok(
      res,
      {
        totalUsers,
        activeUsers,
        suspendedUsers,
        byRole: {
          customers: customerCount,
          workers: workerCount,
          cooperatives: cooperativeCount,
          superadmins: superAdminCount,
        },
      },
      "User statistics retrieved successfully"
    );
  } catch (error: any) {
    console.error("Failed to retrieve user stats:", error);
    return fail(res, error.message || "Failed to retrieve user stats", null, 500);
  }
}

/**
 * Get single user profile with linked worker/cooperative entity and booking history
 */
export async function getAdminUserById(req: Request, res: Response) {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!paramId || !mongoose.Types.ObjectId.isValid(paramId)) {
      return fail(res, "Invalid user ID format", null, 400);
    }

    const user = await User.findById(paramId).select("-password").lean();
    if (!user) {
      return fail(res, "User not found", null, 404);
    }

    const [workerProfile, cooperativeProfile, customerBookingsCount] = await Promise.all([
      Worker.findOne({ userId: user._id })
        .populate("skills", "name")
        .populate("category", "name icon slug description")
        .populate("categories", "name icon slug description")
        .lean(),
      Cooperative.findOne({ userId: user._id }).lean(),
      Booking.countDocuments({ customer: user._id }),
    ]);

    return ok(
      res,
      {
        user,
        workerProfile,
        cooperativeProfile,
        activity: {
          customerBookingsCount,
        },
      },
      "User details retrieved successfully"
    );
  } catch (error: any) {
    console.error("Failed to retrieve user details:", error);
    return fail(res, error.message || "Failed to retrieve user details", null, 500);
  }
}

/**
 * Update user account status (ACTIVE, SUSPEND, INACTIVE) with audit reason
 */
export async function updateAdminUserStatus(req: Request, res: Response) {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!paramId || !mongoose.Types.ObjectId.isValid(paramId)) {
      return fail(res, "Invalid user ID format", null, 400);
    }

    const currentAdminId = (req.user as any)?.userId || (req.user as any)?.id;
    if (currentAdminId && currentAdminId.toString() === paramId) {
      return fail(res, "Cannot modify your own administrative account status", null, 403);
    }

    const { status, reason } = req.body;
    if (!status || !Object.values(AccountStatus).includes(status)) {
      return fail(res, "Invalid account status specified", null, 400);
    }

    const user = await User.findById(paramId);
    if (!user) {
      return fail(res, "User not found", null, 404);
    }

    user.accountStatus = status;
    await user.save();

    return ok(
      res,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        accountStatus: user.accountStatus,
        reason: reason || "Status updated by platform super admin",
      },
      `User account status updated to ${status}`
    );
  } catch (error: any) {
    console.error("Failed to update user status:", error);
    return fail(res, error.message || "Failed to update user status", null, 500);
  }
}

/**
 * Update assigned roles for a user
 */
export async function updateAdminUserRoles(req: Request, res: Response) {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!paramId || !mongoose.Types.ObjectId.isValid(paramId)) {
      return fail(res, "Invalid user ID format", null, 400);
    }

    const { roles } = req.body;
    if (!Array.isArray(roles) || roles.length === 0) {
      return fail(res, "At least one role must be assigned to the user", null, 400);
    }

    // Validate that all elements are valid UserRole enum members
    const validRoles = Object.values(UserRole);
    const hasInvalidRole = roles.some((r) => !validRoles.includes(r));
    if (hasInvalidRole) {
      return fail(res, "One or more specified roles are invalid", null, 400);
    }

    const currentAdminId = (req.user as any)?.userId || (req.user as any)?.id;
    if (currentAdminId && currentAdminId.toString() === paramId) {
      if (!roles.includes(UserRole.SUPERADMIN)) {
        return fail(res, "Cannot revoke SUPERADMIN role from your own session", null, 403);
      }
    }

    const user = await User.findById(paramId);
    if (!user) {
      return fail(res, "User not found", null, 404);
    }

    user.role = roles;
    await user.save();

    return ok(
      res,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      "User roles updated successfully"
    );
  } catch (error: any) {
    console.error("Failed to update user roles:", error);
    return fail(res, error.message || "Failed to update user roles", null, 500);
  }
}
