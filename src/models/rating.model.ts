import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IRating extends Document {
  booking: Types.ObjectId;
  bookingId?: Types.ObjectId;
  customer: Types.ObjectId;
  customerId?: Types.ObjectId;
  worker: Types.ObjectId;
  workerId?: Types.ObjectId;
  service?: Types.ObjectId;
  serviceId?: Types.ObjectId;
  cooperative?: Types.ObjectId;
  cooperativeId?: Types.ObjectId;

  rating: number; // 1 to 5
  review?: string; // Optional customer feedback / comment

  createdAt: Date;
  updatedAt: Date;
}

export interface IRatingModel extends Model<IRating> {
  calculateAverageRating(workerId: Types.ObjectId | string): Promise<void>;
}

const ratingSchema = new Schema<IRating, IRatingModel>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking reference is required"],
      unique: true,
    },

    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer reference is required"],
      index: true,
    },

    worker: {
      type: Schema.Types.ObjectId,
      ref: "Worker",
      required: [true, "Worker reference is required"],
      index: true,
    },

    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      index: true,
    },

    cooperative: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast retrieval
ratingSchema.index({ worker: 1, rating: -1 });
ratingSchema.index({ customer: 1, createdAt: -1 });

// Static method to calculate worker average rating
ratingSchema.statics.calculateAverageRating = async function (
  workerId: Types.ObjectId | string
) {
  try {
    const stats = await this.aggregate([
      {
        $match: {
          worker: new Types.ObjectId(workerId.toString()),
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
      await mongoose.model("Worker").findByIdAndUpdate(workerId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
      });
    } else {
      await mongoose.model("Worker").findByIdAndUpdate(workerId, {
        rating: 0,
      });
    }
  } catch (error) {
    console.error("Error updating worker average rating:", error);
  }
};

// Post-save hook to recalculate worker average rating
ratingSchema.post("save", async function () {
  try {
    const RatingModel = this.constructor as IRatingModel;
    if (this.worker) {
      await RatingModel.calculateAverageRating(this.worker);
    }
  } catch (error) {
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

const Rating: IRatingModel =
  (mongoose.models.Rating as IRatingModel) ||
  mongoose.model<IRating, IRatingModel>("Rating", ratingSchema);

// Automatically drop stale bookingId_1 index that conflicts with booking field
const dropStaleBookingIdIndex = async () => {
  try {
    const indexes = await Rating.collection.indexes();
    const staleIndex = indexes.find((idx) => idx.name === "bookingId_1");
    if (staleIndex) {
      await Rating.collection.dropIndex("bookingId_1");
      console.log("Successfully dropped stale bookingId_1 index from ratings collection");
    }
  } catch {
    // Ignore if collection does not exist or index is already dropped
  }
};

mongoose.connection.on("connected", dropStaleBookingIdIndex);
if (mongoose.connection.readyState === 1) {
  dropStaleBookingIdIndex();
}

export default Rating;
