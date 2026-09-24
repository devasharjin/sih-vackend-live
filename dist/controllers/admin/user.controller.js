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
exports.getAdminUsers = getAdminUsers;
exports.getAdminUserStats = getAdminUserStats;
exports.getAdminUserById = getAdminUserById;
exports.updateAdminUserStatus = updateAdminUserStatus;
exports.updateAdminUserRoles = updateAdminUserRoles;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importStar(require("../../models/auth/user.model"));
const worker_model_1 = __importDefault(require("../../models/auth/worker.model"));
const cooperative_model_1 = __importDefault(require("../../models/auth/cooperative.model"));
const booking_model_1 = __importDefault(require("../../models/booking.model"));
const envelope_1 = require("../../shared/envelope");
/**
 * Get paginated, searchable list of users with role and status filters
 */
async function getAdminUsers(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 15));
        const skip = (page - 1) * limit;
        const role = req.query.role?.trim().toUpperCase();
        const status = req.query.status?.trim().toUpperCase();
        const search = req.query.search?.trim();
        const query = {};
        if (role && role !== "ALL" && Object.values(user_model_1.UserRole).includes(role)) {
            query.role = role;
        }
        if (status && status !== "ALL" && Object.values(user_model_1.AccountStatus).includes(status)) {
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
            user_model_1.default.find(query)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            user_model_1.default.countDocuments(query),
        ]);
        const totalPages = Math.ceil(total / limit) || 1;
        return (0, envelope_1.ok)(res, {
            users,
            total,
            page,
            limit,
            totalPages,
        }, "Users retrieved successfully");
    }
    catch (error) {
        console.error("Failed to retrieve users:", error);
        return (0, envelope_1.fail)(res, error.message || "Failed to retrieve users", null, 500);
    }
}
/**
 * Get aggregated user count metrics by role and account status
 */
async function getAdminUserStats(req, res) {
    try {
        const [totalUsers, activeUsers, suspendedUsers, customerCount, workerCount, cooperativeCount, superAdminCount,] = await Promise.all([
            user_model_1.default.countDocuments(),
            user_model_1.default.countDocuments({ accountStatus: user_model_1.AccountStatus.ACTIVE }),
            user_model_1.default.countDocuments({ accountStatus: user_model_1.AccountStatus.SUSPEND }),
            user_model_1.default.countDocuments({ role: user_model_1.UserRole.CUSTOMER }),
            user_model_1.default.countDocuments({ role: user_model_1.UserRole.WORKER }),
            user_model_1.default.countDocuments({ role: user_model_1.UserRole.COOPERATIVE }),
            user_model_1.default.countDocuments({ role: user_model_1.UserRole.SUPERADMIN }),
        ]);
        return (0, envelope_1.ok)(res, {
            totalUsers,
            activeUsers,
            suspendedUsers,
            byRole: {
                customers: customerCount,
                workers: workerCount,
                cooperatives: cooperativeCount,
                superadmins: superAdminCount,
            },
        }, "User statistics retrieved successfully");
    }
    catch (error) {
        console.error("Failed to retrieve user stats:", error);
        return (0, envelope_1.fail)(res, error.message || "Failed to retrieve user stats", null, 500);
    }
}
/**
 * Get single user profile with linked worker/cooperative entity and booking history
 */
async function getAdminUserById(req, res) {
    try {
        const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!paramId || !mongoose_1.default.Types.ObjectId.isValid(paramId)) {
            return (0, envelope_1.fail)(res, "Invalid user ID format", null, 400);
        }
        const user = await user_model_1.default.findById(paramId).select("-password").lean();
        if (!user) {
            return (0, envelope_1.fail)(res, "User not found", null, 404);
        }
        const [workerProfile, cooperativeProfile, customerBookingsCount] = await Promise.all([
            worker_model_1.default.findOne({ userId: user._id })
                .populate("skills", "name")
                .populate("category", "name icon slug description")
                .populate("categories", "name icon slug description")
                .lean(),
            cooperative_model_1.default.findOne({ userId: user._id }).lean(),
            booking_model_1.default.countDocuments({ customer: user._id }),
        ]);
        return (0, envelope_1.ok)(res, {
            user,
            workerProfile,
            cooperativeProfile,
            activity: {
                customerBookingsCount,
            },
        }, "User details retrieved successfully");
    }
    catch (error) {
        console.error("Failed to retrieve user details:", error);
        return (0, envelope_1.fail)(res, error.message || "Failed to retrieve user details", null, 500);
    }
}
/**
 * Update user account status (ACTIVE, SUSPEND, INACTIVE) with audit reason
 */
async function updateAdminUserStatus(req, res) {
    try {
        const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!paramId || !mongoose_1.default.Types.ObjectId.isValid(paramId)) {
            return (0, envelope_1.fail)(res, "Invalid user ID format", null, 400);
        }
        const currentAdminId = req.user?.userId || req.user?.id;
        if (currentAdminId && currentAdminId.toString() === paramId) {
            return (0, envelope_1.fail)(res, "Cannot modify your own administrative account status", null, 403);
        }
        const { status, reason } = req.body;
        if (!status || !Object.values(user_model_1.AccountStatus).includes(status)) {
            return (0, envelope_1.fail)(res, "Invalid account status specified", null, 400);
        }
        const user = await user_model_1.default.findById(paramId);
        if (!user) {
            return (0, envelope_1.fail)(res, "User not found", null, 404);
        }
        user.accountStatus = status;
        await user.save();
        return (0, envelope_1.ok)(res, {
            id: user._id,
            name: user.name,
            email: user.email,
            accountStatus: user.accountStatus,
            reason: reason || "Status updated by platform super admin",
        }, `User account status updated to ${status}`);
    }
    catch (error) {
        console.error("Failed to update user status:", error);
        return (0, envelope_1.fail)(res, error.message || "Failed to update user status", null, 500);
    }
}
/**
 * Update assigned roles for a user
 */
async function updateAdminUserRoles(req, res) {
    try {
        const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!paramId || !mongoose_1.default.Types.ObjectId.isValid(paramId)) {
            return (0, envelope_1.fail)(res, "Invalid user ID format", null, 400);
        }
        const { roles } = req.body;
        if (!Array.isArray(roles) || roles.length === 0) {
            return (0, envelope_1.fail)(res, "At least one role must be assigned to the user", null, 400);
        }
        // Validate that all elements are valid UserRole enum members
        const validRoles = Object.values(user_model_1.UserRole);
        const hasInvalidRole = roles.some((r) => !validRoles.includes(r));
        if (hasInvalidRole) {
            return (0, envelope_1.fail)(res, "One or more specified roles are invalid", null, 400);
        }
        const currentAdminId = req.user?.userId || req.user?.id;
        if (currentAdminId && currentAdminId.toString() === paramId) {
            if (!roles.includes(user_model_1.UserRole.SUPERADMIN)) {
                return (0, envelope_1.fail)(res, "Cannot revoke SUPERADMIN role from your own session", null, 403);
            }
        }
        const user = await user_model_1.default.findById(paramId);
        if (!user) {
            return (0, envelope_1.fail)(res, "User not found", null, 404);
        }
        user.role = roles;
        await user.save();
        return (0, envelope_1.ok)(res, {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        }, "User roles updated successfully");
    }
    catch (error) {
        console.error("Failed to update user roles:", error);
        return (0, envelope_1.fail)(res, error.message || "Failed to update user roles", null, 500);
    }
}
//# sourceMappingURL=user.controller.js.map