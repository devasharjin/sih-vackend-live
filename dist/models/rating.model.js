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
const mongoose_1 = __importStar(require("mongoose"));
const ratingSchema = new mongoose_1.Schema({
    booking: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Booking",
        required: [true, "Booking reference is required"],
        unique: true,
    },
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Customer reference is required"],
        index: true,
    },
    worker: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Worker",
        required: [true, "Worker reference is required"],
        index: true,
    },
    service: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Service",
        index: true,
    },
    cooperative: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Cooperative",
        index: true,
    },
    rating: {
        type: Number,
        required: [true, "Rating is required"],
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating cannot exceed 5"],
    },
    review: {
        type: String,
        trim: true,
        maxlength: [1000, "Review cannot exceed 1000 characters"],
        default: "",
    },
}, {
    timestamps: true,
});
// Compound indexes for fast retrieval
ratingSchema.index({ worker: 1, rating: -1 });
ratingSchema.index({ customer: 1, createdAt: -1 });
// Static method to calculate worker average rating
ratingSchema.statics.calculateAverageRating = async function (workerId) {
    try {
        const stats = await this.aggregate([
            {
                $match: {
                    worker: new mongoose_1.Types.ObjectId(workerId.toString()),
                },
            },
            {
                $group: {
                    _id: "$worker",
                    avgRating: { $avg: "$rating" },
                    totalRatings: { $sum: 1 },
                },
            },
        ]);
        if (stats.length > 0) {
            await mongoose_1.default.model("Worker").findByIdAndUpdate(workerId, {
                rating: Math.round(stats[0].avgRating * 10) / 10,
            });
        }
        else {
            await mongoose_1.default.model("Worker").findByIdAndUpdate(workerId, {
                rating: 0,
            });
        }
    }
    catch (error) {
        console.error("Error updating worker average rating:", error);
    }
};
// Post-save hook to recalculate worker average rating
ratingSchema.post("save", async function () {
    try {
        const RatingModel = this.constructor;
        if (this.worker) {
            await RatingModel.calculateAverageRating(this.worker);
        }
    }
    catch (error) {
        console.error("Error in rating post-save hook:", error);
    }
});
// Virtual getters for compatibility
ratingSchema.virtual("bookingId").get(function () {
    return this.booking;
});
ratingSchema.virtual("customerId").get(function () {
    return this.customer;
});
ratingSchema.virtual("workerId").get(function () {
    return this.worker;
});
ratingSchema.virtual("serviceId").get(function () {
    return this.service;
});
ratingSchema.virtual("cooperativeId").get(function () {
    return this.cooperative;
});
const Rating = mongoose_1.default.models.Rating ||
    mongoose_1.default.model("Rating", ratingSchema);
// Automatically drop stale bookingId_1 index that conflicts with booking field
const dropStaleBookingIdIndex = async () => {
    try {
        const indexes = await Rating.collection.indexes();
        const staleIndex = indexes.find((idx) => idx.name === "bookingId_1");
        if (staleIndex) {
            await Rating.collection.dropIndex("bookingId_1");
            console.log("Successfully dropped stale bookingId_1 index from ratings collection");
        }
    }
    catch {
        // Ignore if collection does not exist or index is already dropped
    }
};
mongoose_1.default.connection.on("connected", dropStaleBookingIdIndex);
if (mongoose_1.default.connection.readyState === 1) {
    dropStaleBookingIdIndex();
}
exports.default = Rating;
//# sourceMappingURL=rating.model.js.map