import { Request, Response } from "express";
import mongoose from "mongoose";
import Booking, {
  BookingStatus,
  BookingType,
  CancelledByRole,
} from "../../models/booking.model";
import Worker from "../../models/auth/worker.model";
import User from "../../models/auth/user.model";
import Service from "../../models/service.model";
import { fail, ok } from "../../shared/envelope";
import { FIXED_TRANSPORT_FEE, BillingService } from "../../services/billing.service";
import { notifyCustomer } from "../../services/socket.service";

/**
 * Calculates distance (randomly up to 5 km) and transport fee (₹5 per 1 km).
 * Uses deterministic pseudo-random hashing on the gig ID so distance stays stable
 * per job across requests and polling cycles.
 */
function getGigDistanceInfo(id: any) {
  const idStr = id ? id.toString() : "seed_gig";
  let h = 0;
  for (let i = 0; i < idStr.length; i++) {
    h = (Math.imul(31, h) + idStr.charCodeAt(i)) | 0;
  }
  let t = h + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const normalized = ((t ^ (t >>> 14)) >>> 0) / 4294967296;

  // Random distance up to 5.0 km (range: 0.5 to 5.0 km, 1 decimal place)
  const min = 0.5;
  const max = 5.0;
  const distanceKm = Math.round((min + normalized * (max - min)) * 10) / 10;
  // Transport fee is ₹5 per 1 km
  const transportFee = Math.round(distanceKm * 5);

  return {
    distanceKm,
    distanceText: `${distanceKm.toFixed(1)} km`,
    transportFee,
  };
}

function enrichGigWithDistance(gig: any) {
  if (!gig) return gig;
  const { distanceKm, distanceText, transportFee } = getGigDistanceInfo(gig._id);
  const totalAmount = (gig.rate || 0) + transportFee;
  return {
    ...gig,
    distanceKm: gig.distanceKm ?? distanceKm,
    distanceText: gig.distanceText ?? distanceText,
    transportFee: gig.transportFee ?? transportFee,
    totalAmount,
    pricing: gig.pricing
      ? {
        ...gig.pricing,
        transportFee: gig.transportFee ?? transportFee,
        customerTotalAmount: totalAmount,
        workerNetEarnings:
          (gig.rate || 0) - Math.round((gig.rate || 0) * 0.15) + transportFee,
      }
      : gig.pricing,
  };
}

export async function getAvailableGigs(req: Request, res: Response) {
  const userId = (req.user as any)?.userId || (req.user as any)?._id;
  const worker = await Worker.findOne({ userId })
    .select("_id category categories skills cooperativeId rating")
    .lean();

  if (!worker) {
    return fail(res, "Worker profile not found", null, 404);
  }

  const { type } = req.query;
  const workerRating = typeof worker.rating === "number" ? worker.rating : 5.0;

  // Strict service isolation: display ONLY the services that the worker registered
  const registeredSkillIds = (worker.skills || [])
    .map((s: any) => (typeof s === "object" && s?._id ? s._id.toString() : s?.toString()))
    .filter((id: string) => id && mongoose.Types.ObjectId.isValid(id))
    .map((id: string) => new mongoose.Types.ObjectId(id));

  const andConditions: any[] = [
    { status: BookingStatus.PENDING },
    { $or: [{ worker: null }, { worker: { $exists: false } }] },
  ];

  // Premium gigs require rating > 4.5 stars. Hide premium gigs from workers with <= 4.5 rating
  if (workerRating <= 4.5) {
    andConditions.push({ bookingType: { $ne: BookingType.PREMIUM } });
  }

  if (registeredSkillIds.length > 0) {
    // Only display gigs matching the worker's registered services
    andConditions.push({ service: { $in: registeredSkillIds } });
  } else {
    // Fallback if worker has no explicit services registered: match by trade category
    const workerCats = [
      ...(worker.category ? [worker.category] : []),
      ...((worker as any).categories || []),
    ].filter(Boolean);

    if (workerCats.length > 0) {
      const categoryServices = await Service.find({ category: { $in: workerCats } }).distinct("_id");
      andConditions.push({
        $or: [
          { service: { $in: categoryServices } },
          { category: { $in: workerCats } },
        ],
      });
    }
  }

  // Cooperative membership filter: workers only receive unassigned jobs or jobs designated for their cooperative
  if (worker.cooperativeId) {
    andConditions.push({
      $or: [
        { cooperative: worker.cooperativeId },
        { cooperative: null },
        { cooperative: { $exists: false } },
      ],
    });
  }

  if (type && typeof type === "string") {
    const t = type.toLowerCase();
    if (t === "emergency") {
      andConditions.push({ isEmergency: true });
    } else if (t === "premium") {
      andConditions.push({ bookingType: BookingType.PREMIUM });
    } else if (t === "on_demand" || t === "ondemand") {
      andConditions.push({ bookingType: { $in: [BookingType.PREMIUM, BookingType.ON_DEMAND] } });
    } else if (t === "scheduled") {
      andConditions.push({ bookingType: BookingType.SCHEDULED });
    }
  }

  const query = { $and: andConditions };

  // Priority sorting: EMERGENCY gigs ranked FIRST, then imminent scheduled/on-demand dates
  const gigs = await Booking.find(query)
    .populate("service", "name description priceType firstHourRate additionalHourRate transportFee cooperativeShare insuranceShare hourlyPrice metersPrice emergencyAvailable emergencyFee")
    .populate("category", "name icon slug")
    .populate("customer", "name phone profilePicture address")
    .sort({ isEmergency: -1, scheduledDate: 1, createdAt: -1 })
    .lean();

  const formattedGigs = gigs.map(enrichGigWithDistance);

  return ok(res, formattedGigs, "Available gigs retrieved successfully");
}

export async function getMyJobs(req: Request, res: Response) {
  const userId = (req.user as any)?.userId || (req.user as any)?._id;
  const worker = await Worker.findOne({ userId }).select("_id").lean();

  if (!worker) {
    return fail(res, "Worker profile not found", null, 404);
  }

  const { status } = req.query;
  const filter: Record<string, any> = { worker: worker._id };

  if (status && typeof status === "string" && status !== "all") {
    if (status === "active") {
      filter.status = {
        $in: [
          BookingStatus.CONFIRMED,
          BookingStatus.ASSIGNED,
          BookingStatus.IN_PROGRESS,
        ],
      };
    } else if (status === "completed") {
      filter.status = BookingStatus.COMPLETED;
    } else if (status === "cancelled") {
      filter.status = BookingStatus.CANCELLED;
    } else {
      filter.status = status.toUpperCase();
    }
  }

  const jobs = await Booking.find(filter)
    .populate("service", "name description priceType firstHourRate additionalHourRate transportFee cooperativeShare insuranceShare hourlyPrice metersPrice")
    .populate("category", "name icon slug")
    .populate("customer", "name phone profilePicture address")
    .populate("rating")
    .sort({ scheduledDate: -1, createdAt: -1 })
    .lean();

  const formattedJobs = jobs.map(enrichGigWithDistance);

  return ok(res, formattedJobs, "Worker jobs retrieved successfully");
}

export async function getWorkerJobById(req: Request, res: Response) {
  const userId = (req.user as any)?.userId || (req.user as any)?._id;
  const worker = await Worker.findOne({ userId }).select("_id").lean();

  if (!worker) {
    return fail(res, "Worker profile not found", null, 404);
  }

  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid job ID", null, 400);
  }

  const job = await Booking.findById(id)
    .populate("service", "name description priceType firstHourRate additionalHourRate transportFee cooperativeShare insuranceShare hourlyPrice metersPrice")
    .populate("category", "name icon slug")
    .populate("customer", "name phone profilePicture address")
    .populate("rating")
    .lean();

  if (!job) {
    return fail(res, "Job not found", null, 404);
  }

  return ok(res, enrichGigWithDistance(job), "Job retrieved successfully");
}

export async function acceptGig(req: Request, res: Response) {
  const userId = (req.user as any)?.userId || (req.user as any)?._id;
  const worker = await Worker.findOne({ userId }).select("_id category categories skills cooperativeId rating");

  if (!worker) {
    return fail(res, "Worker profile not found", null, 404);
  }

  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid gig ID", null, 400);
  }

  // Atomically find pending and unassigned gig
  const booking = await Booking.findOne({
    _id: id,
    status: BookingStatus.PENDING,
    $or: [{ worker: null }, { worker: { $exists: false } }],
  }).populate("service", "category");

  if (!booking) {
    return fail(
      res,
      "This gig is no longer available or has already been accepted by another worker",
      null,
      409
    );
  }

  // Enforce Premium specialist rating requirement (> 4.5 stars)
  if (booking.bookingType === BookingType.PREMIUM) {
    const workerRating = typeof worker.rating === "number" ? worker.rating : 5.0;
    if (workerRating <= 4.5) {
      return fail(
        res,
        "Premium specialist gigs are reserved exclusively for top-rated specialists with a rating above 4.5 stars.",
        null,
        403
      );
    }
  }

  // Enforce registered trade service match: worker can only accept gigs matching their registered services
  const workerSkills = (worker.skills || []).map((s: any) => s?.toString()).filter(Boolean);
  if (workerSkills.length > 0) {
    const bookingServiceId = (booking.service?._id || booking.service)?.toString();
    if (bookingServiceId && !workerSkills.includes(bookingServiceId)) {
      return fail(
        res,
        "You can only accept jobs matching your registered trade services.",
        null,
        403
      );
    }
  } else {
    // Fallback: enforce trade category match
    const workerCats = [
      ...(worker.category ? [worker.category.toString()] : []),
      ...((worker as any).categories || []).map((c: any) => c.toString()),
    ].filter(Boolean);

    if (workerCats.length > 0) {
      const bookingCat = (booking.category || (booking.service as any)?.category)?.toString();
      if (bookingCat && !workerCats.includes(bookingCat)) {
        return fail(
          res,
          "You can only accept jobs matching your registered trade category.",
          null,
          403
        );
      }
    }
  }

  // Enforce cooperative isolation if booking is reserved for a specific cooperative
  if (
    booking.cooperative &&
    worker.cooperativeId &&
    booking.cooperative.toString() !== worker.cooperativeId.toString()
  ) {
    return fail(
      res,
      "This job is reserved for members of another cooperative society.",
      null,
      403
    );
  }

  // Enforce weekly service acceptance limit
  const activeJobsCount = await Booking.countDocuments({
    worker: worker._id,
    status: {
      $in: [
        BookingStatus.CONFIRMED,
        BookingStatus.ASSIGNED,
        BookingStatus.IN_PROGRESS,
      ],
    },
  });

  const weeklyLimit = worker.weeklyServiceLimit ?? 6;
  if (activeJobsCount >= weeklyLimit) {
    return fail(
      res,
      `Weekly service acceptance limit reached (${activeJobsCount}/${weeklyLimit}). Please complete an active service to decrease your count and accept more services.`,
      { activeJobsCount, weeklyLimit, canAcceptMore: false },
      400
    );
  }

  booking.worker = worker._id;
  if (!booking.cooperative && worker.cooperativeId) {
    booking.cooperative = worker.cooperativeId;
  }
  booking.status = BookingStatus.CONFIRMED;
  booking.assignedAt = new Date();

  await booking.save();

  worker.weeklyAcceptedCount = activeJobsCount + 1;
  await worker.save();

  const updated = await Booking.findById(booking._id)
    .populate("service", "name description priceType firstHourRate additionalHourRate transportFee cooperativeShare insuranceShare hourlyPrice metersPrice")
    .populate("category", "name icon")
    .populate("customer", "name phone profilePicture address")
    .lean();

  const message = booking.isEmergency
    ? "🚨 Emergency callout accepted! Proceed immediately to the customer location."
    : booking.bookingType === BookingType.PREMIUM
      ? "⭐ Premium specialist assignment accepted! Deliver top-tier service."
      : "Gig accepted successfully! It is now in your active jobs.";

  // Real-time socket notification to customer
  try {
    const workerUser = await User.findById(worker.userId).select("name phone").lean();
    const customerId = (updated as any)?.customer?._id || booking.customer;
    const serviceName = (updated as any)?.service?.name || "Service";

    if (customerId) {
      notifyCustomer(customerId.toString(), "job:status_updated", {
        type: "JOB_ACCEPTED",
        title: "Worker Accepted Your Booking!",
        message: `${workerUser?.name || "A certified worker"} has accepted your booking #${booking.bookingNumber} (${serviceName}) and is on their way!`,
        bookingId: booking._id.toString(),
        bookingNumber: booking.bookingNumber,
        status: BookingStatus.CONFIRMED,
        serviceName,
        worker: {
          id: worker._id.toString(),
          name: workerUser?.name || "Verified Specialist",
          phone: workerUser?.phone || "",
          rating: worker.rating,
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Failed to emit socket notification for acceptGig:", err);
  }

  return ok(res, enrichGigWithDistance(updated), message);
}

export async function updateJobStatus(req: Request, res: Response) {
  const userId = (req.user as any)?.userId || (req.user as any)?._id;
  const worker = await Worker.findOne({ userId }).select(
    "_id totalJobsCompleted weeklyAcceptedCount weeklyServiceLimit"
  );

  if (!worker) {
    return fail(res, "Worker profile not found", null, 404);
  }

  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  const { status, reason } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid job ID", null, 400);
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    return fail(res, "Job not found", null, 404);
  }

  // Verify worker owns this job
  if (String(booking.worker) !== String(worker._id)) {
    return fail(res, "You are not assigned to this job", null, 403);
  }

  if (status === BookingStatus.IN_PROGRESS) {
    if (booking.status === BookingStatus.COMPLETED) {
      return fail(res, "Cannot start a job that has already been completed", null, 400);
    }
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED) {
      return fail(res, "Cannot start a cancelled or rejected job", null, 400);
    }
    if (booking.startedAt || booking.status === BookingStatus.IN_PROGRESS) {
      return fail(res, "Job has already been started and is currently in progress", null, 400);
    }
    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.ASSIGNED) {
      return fail(res, "Job must be confirmed or assigned before starting", null, 400);
    }

    // Record exact start timestamp on backend
    booking.status = BookingStatus.IN_PROGRESS;
    booking.startedAt = new Date();
  } else if (status === BookingStatus.COMPLETED) {
    if (booking.status === BookingStatus.COMPLETED || booking.completedAt) {
      return fail(res, "Job has already been completed and finalized", null, 400);
    }
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED) {
      return fail(res, "Cannot complete a cancelled or rejected job", null, 400);
    }
    if (booking.status !== BookingStatus.IN_PROGRESS) {
      return fail(res, "Job must be started (on-site in progress) before it can be completed", null, 400);
    }

    // Record exact completion timestamp on backend
    const completedTimestamp = new Date();
    const startTimestamp = booking.startedAt || booking.assignedAt || booking.createdAt || new Date();
    booking.startedAt = startTimestamp;
    booking.completedAt = completedTimestamp;

    // Validate timestamps & calculate actual duration in minutes
    let durationMinutes = 0;
    try {
      durationMinutes = BillingService.calculateWorkingDurationMinutes(
        booking.startedAt,
        booking.completedAt
      );
    } catch (err: any) {
      return fail(res, err.message || "Invalid work duration timestamps", null, 400);
    }

    // Retrieve rates from historical booking pricing snapshot or fall back to service
    let firstHourRate = booking.pricing?.firstHourRate;
    let additionalHourRate = booking.pricing?.additionalHourRate;
    let cooperativePercentage = booking.pricing?.cooperativePercentage;
    let insurancePercentage = booking.pricing?.insurancePercentage;

    if (!firstHourRate || firstHourRate <= 0) {
      const serviceDoc = await Service.findById(booking.service);
      const baseFirst = serviceDoc?.firstHourRate ?? serviceDoc?.hourlyPrice ?? booking.rate ?? 0;
      const baseAddl = serviceDoc?.additionalHourRate ?? serviceDoc?.firstHourRate ?? serviceDoc?.hourlyPrice ?? baseFirst;

      const multiplier =
        booking.bookingType === BookingType.EMERGENCY || booking.isEmergency
          ? 1.20
          : booking.bookingType === BookingType.PREMIUM || (booking.bookingType as any) === "ON_DEMAND"
            ? 1.15
            : 1.0;

      firstHourRate = Math.round(baseFirst * multiplier);
      additionalHourRate = Math.round(baseAddl * multiplier);
      cooperativePercentage = serviceDoc?.cooperativeShare ?? 10;
      insurancePercentage = serviceDoc?.insuranceShare ?? 5;
    }

    const calcResult = BillingService.calculateBillingAndDistribution(durationMinutes, {
      firstHourRate: firstHourRate ?? 0,
      additionalHourRate: additionalHourRate ?? firstHourRate ?? 0,
      cooperativePercentage: cooperativePercentage ?? 10,
      insurancePercentage: insurancePercentage ?? 5,
      transportFee: FIXED_TRANSPORT_FEE,
    });

    booking.pricing = {
      firstHourRate: calcResult.firstHourCharge,
      additionalHourRate: additionalHourRate ?? calcResult.firstHourCharge,
      transportFee: calcResult.transportFee,
      cooperativePercentage: cooperativePercentage ?? 10,
      insurancePercentage: insurancePercentage ?? 5,
      actualDurationMinutes: calcResult.actualDurationMinutes,
      billableHours: calcResult.billableHours,
      firstHourCharge: calcResult.firstHourCharge,
      additionalHoursCharge: calcResult.additionalHoursCharge,
      serviceAmount: calcResult.serviceAmount,
      cooperativeShareAmount: calcResult.cooperativeAdminShare,
      insuranceShareAmount: calcResult.insuranceShare,
      workerNetEarnings: calcResult.workerNetEarnings,
      customerTotalAmount: calcResult.customerTotal,
      isFinalized: true,
    };

    booking.rate = calcResult.firstHourCharge;
    booking.units = calcResult.billableHours;
    booking.totalAmount = calcResult.customerTotal;
    booking.status = BookingStatus.COMPLETED;

    // Increment worker's completed jobs and decrease active accepted count
    worker.totalJobsCompleted = (worker.totalJobsCompleted || 0) + 1;
    worker.weeklyAcceptedCount = Math.max(0, (worker.weeklyAcceptedCount || 1) - 1);
    await worker.save();
  } else if (status === BookingStatus.CANCELLED) {
    if (booking.status === BookingStatus.COMPLETED) {
      return fail(res, "Completed jobs cannot be cancelled", null, 400);
    }
    if (booking.status === BookingStatus.CANCELLED) {
      return fail(res, "Job is already cancelled", null, 400);
    }

    // Strict cooperative policy: limit worker to cancel at most 1 request per day
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const cancellationsToday = await Booking.countDocuments({
      worker: worker._id,
      status: BookingStatus.CANCELLED,
      cancelledBy: CancelledByRole.WORKER,
      cancelledAt: { $gte: startOfToday },
    });

    if (cancellationsToday >= 1) {
      return fail(
        res,
        "Daily cancellation limit reached. Workers are allowed to cancel only 1 request per day to maintain cooperative service reliability.",
        { cancellationsToday, cancellationLimit: 1, canCancelToday: false },
        400
      );
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelledBy = CancelledByRole.WORKER;
    booking.cancellationReason =
      typeof reason === "string" && reason.trim() ? reason.trim() : "Cancelled by worker";

    // Decrement worker's active accepted count when job is cancelled
    worker.weeklyAcceptedCount = Math.max(0, (worker.weeklyAcceptedCount || 1) - 1);
    await worker.save();
  } else {
    return fail(res, "Invalid status transition", null, 400);
  }

  await booking.save();

  const updated = await Booking.findById(booking._id)
    .populate("service", "name description priceType firstHourRate additionalHourRate transportFee cooperativeShare insuranceShare hourlyPrice metersPrice")
    .populate("category", "name icon")
    .populate("customer", "name phone profilePicture address")
    .populate("rating")
    .lean();

  // Real-time socket notification to customer on start / completion / cancellation
  try {
    const customerId = (updated as any)?.customer?._id || booking.customer;
    const serviceName = (updated as any)?.service?.name || "Service";

    if (customerId) {
      if (booking.status === BookingStatus.IN_PROGRESS) {
        notifyCustomer(customerId.toString(), "job:status_updated", {
          type: "JOB_STARTED",
          title: "Worker Started Your Service!",
          message: `Your booking #${booking.bookingNumber} (${serviceName}) is now in progress on-site!`,
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
          status: BookingStatus.IN_PROGRESS,
          serviceName,
          startedAt: booking.startedAt?.toISOString(),
          timestamp: new Date().toISOString(),
        });
      } else if (booking.status === BookingStatus.COMPLETED) {
        notifyCustomer(customerId.toString(), "job:status_updated", {
          type: "JOB_COMPLETED",
          title: "Service Completed!",
          message: `Your booking #${booking.bookingNumber} (${serviceName}) has been completed. Total amount: ₹${booking.totalAmount}.`,
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
          status: BookingStatus.COMPLETED,
          serviceName,
          totalAmount: booking.totalAmount,
          completedAt: booking.completedAt?.toISOString(),
          timestamp: new Date().toISOString(),
        });
      } else if (booking.status === BookingStatus.CANCELLED) {
        notifyCustomer(customerId.toString(), "job:status_updated", {
          type: "JOB_CANCELLED",
          title: "Booking Cancelled by Worker",
          message: `Your booking #${booking.bookingNumber} (${serviceName}) was cancelled by the assigned worker: ${booking.cancellationReason || "No reason specified"}.`,
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
          status: BookingStatus.CANCELLED,
          serviceName,
          reason: booking.cancellationReason,
          cancelledAt: booking.cancelledAt?.toISOString(),
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.error("Failed to emit socket notification for updateJobStatus:", err);
  }

  return ok(res, updated, `Job status updated to ${booking.status}`);
}

export async function getWorkerStats(req: Request, res: Response) {
  const userId = (req.user as any)?.userId || (req.user as any)?._id;
  const worker = await Worker.findOne({ userId })
    .select("_id category categories skills cooperativeId rating totalJobsCompleted verificationStatus weeklyServiceLimit weeklyAcceptedCount")
    .lean();

  if (!worker) {
    return fail(res, "Worker profile not found", null, 404);
  }

  const registeredSkillIds = (worker.skills || [])
    .map((s: any) => (typeof s === "object" && s?._id ? s._id.toString() : s?.toString()))
    .filter((id: string) => id && mongoose.Types.ObjectId.isValid(id))
    .map((id: string) => new mongoose.Types.ObjectId(id));

  const statsAndConditions: any[] = [
    { status: BookingStatus.PENDING },
    { $or: [{ worker: null }, { worker: { $exists: false } }] },
  ];

  if (registeredSkillIds.length > 0) {
    statsAndConditions.push({ service: { $in: registeredSkillIds } });
  } else {
    const workerCats = [
      ...(worker.category ? [worker.category] : []),
      ...((worker as any).categories || []),
    ].filter(Boolean);

    if (workerCats.length > 0) {
      statsAndConditions.push({ category: { $in: workerCats } });
    }
  }

  if (worker.cooperativeId) {
    statsAndConditions.push({
      $or: [
        { cooperative: worker.cooperativeId },
        { cooperative: null },
        { cooperative: { $exists: false } },
      ],
    });
  }

  const gigFilter = { $and: statsAndConditions };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Run all counts and earnings aggregate in parallel in 1 roundtrip
  const [activeJobsCount, completedJobsCount, availableGigsCount, cancellationsToday, earningsAgg] =
    await Promise.all([
      Booking.countDocuments({
        worker: worker._id,
        status: {
          $in: [
            BookingStatus.CONFIRMED,
            BookingStatus.ASSIGNED,
            BookingStatus.IN_PROGRESS,
          ],
        },
      }),
      Booking.countDocuments({
        worker: worker._id,
        status: BookingStatus.COMPLETED,
      }),
      Booking.countDocuments(gigFilter),
      Booking.countDocuments({
        worker: worker._id,
        status: BookingStatus.CANCELLED,
        cancelledBy: CancelledByRole.WORKER,
        cancelledAt: { $gte: startOfToday },
      }),
      Booking.aggregate([
        {
          $match: {
            worker: worker._id,
            status: BookingStatus.COMPLETED,
          },
        },
        {
          $group: {
            _id: null,
            totalEarnings: {
              $sum: {
                $ifNull: ["$pricing.workerNetEarnings", "$totalAmount"],
              },
            },
          },
        },
      ]),
    ]);

  const totalEarnings = earningsAgg[0]?.totalEarnings || 0;

  return ok(
    res,
    {
      activeJobs: activeJobsCount,
      completedJobs: completedJobsCount,
      availableGigs: availableGigsCount,
      totalEarnings,
      rating: worker.rating || 0,
      totalJobsCompleted: worker.totalJobsCompleted || completedJobsCount,
      verificationStatus: worker.verificationStatus,
      cancellationsToday,
      cancellationLimit: 1,
      canCancelToday: cancellationsToday < 1,
      weeklyServiceLimit: (worker as any)?.weeklyServiceLimit || 6,
      weeklyAcceptedCount: activeJobsCount,
      weeklyServicesRemaining: Math.max(0, ((worker as any)?.weeklyServiceLimit || 6) - activeJobsCount),
      canAcceptWeeklyService: activeJobsCount < ((worker as any)?.weeklyServiceLimit || 6),
    },
    "Worker stats retrieved successfully"
  );
}

export async function updateWorkerProfile(req: Request, res: Response) {
  const userId = (req.user as any)?.userId || (req.user as any)?._id;
  const worker = await Worker.findOne({ userId });

  if (!worker) {
    return fail(res, "Worker profile not found", null, 404);
  }

  const { availability, experience, location, isActive, name, phone } = req.body;

  if (availability !== undefined) {
    worker.availability = availability;
  }
  if (experience !== undefined && !isNaN(Number(experience))) {
    worker.experience = Number(experience);
  }
  if (isActive !== undefined) {
    worker.isActive = Boolean(isActive);
  }
  if (location && typeof location === "object") {
    worker.location = {
      address: location.address !== undefined ? String(location.address) : worker.location?.address || "",
      city: location.city !== undefined ? String(location.city) : worker.location?.city || "",
      state: location.state !== undefined ? String(location.state) : worker.location?.state || "",
      pincode: location.pincode !== undefined ? String(location.pincode) : worker.location?.pincode || "",
      latitude: location.latitude !== undefined ? Number(location.latitude) : worker.location?.latitude || 0,
      longitude: location.longitude !== undefined ? Number(location.longitude) : worker.location?.longitude || 0,
    };
  }

  await worker.save();

  if (name || phone) {
    const user = await User.findById(userId);
    if (user) {
      if (name && typeof name === "string") user.name = name.trim();
      if (phone && typeof phone === "string") user.phone = phone.trim();
      await user.save();
    }
  }

  const updatedWorker = await Worker.findOne({ userId })
    .populate("cooperativeId")
    .populate("category", "name icon description")
    .populate("categories", "name icon description")
    .populate("skills", "name description priceType hourlyPrice metersPrice");
  const updatedUser = await User.findById(userId);

  return ok(
    res,
    {
      user: updatedUser,
      worker: updatedWorker,
      profile: updatedWorker,
    },
    "Worker profile updated successfully"
  );
}

