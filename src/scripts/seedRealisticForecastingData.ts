import dns from 'dns';
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import mongoose, { Types } from 'mongoose';
import { connectDB, disconnectDB } from '../config/database';
import User, { UserRole, AccountStatus } from '../models/auth/user.model';
import Cooperative from '../models/auth/cooperative.model';
import Worker, { AvailabilityStatus, VerificationStatus } from '../models/auth/worker.model';
import Category from '../models/category.model';
import Service from '../models/service.model';
import Booking, {
  BookingStatus,
  BookingType,
  PaymentStatus,
  UrgencyLevel,
} from '../models/booking.model';

export const REAL_ZONES = [
  "Kanyakumari Town - Central Zone",
  "Nagercoil - Commercial & Retail Hub",
  "Coastal & Beachfront Tourism Corridor",
  "Agasteeswaram - Residential Suburbs",
  "Kattathurai & Pulluvilai Craft Cluster",
];

async function seed() {
  await connectDB();
  console.log("Connected to MongoDB for realistic data population...");

  // 1. Ensure Categories exist
  let electricalCat = await Category.findOne({ name: "Electrical Services" });
  if (!electricalCat) {
    electricalCat = await Category.create({
      name: "Electrical Services",
      slug: "electrical-services",
      icon: "⚡",
      description: "Professional electrical services for residential, commercial and maintenance needs",
      isActive: true,
    });
  }

  let plumbingCat = await Category.findOne({ name: "Plumbing Services" });
  if (!plumbingCat) {
    plumbingCat = await Category.create({
      name: "Plumbing Services",
      slug: "plumbing-services",
      icon: "🚰",
      description: "Professional plumbing services, pipe repairs and water care",
      isActive: true,
    });
  }

  let carpentryCat = await Category.findOne({ name: "Carpentry Services" });
  if (!carpentryCat) {
    carpentryCat = await Category.create({
      name: "Carpentry Services",
      slug: "carpentry-services",
      icon: "🪚",
      description: "Professional carpentry, furniture woodwork, doors and fixtures",
      isActive: true,
    });
  }

  // 2. Ensure Services exist under all 3 categories
  let wiringService = await Service.findOne({ name: "Electrical Wiring" });
  if (!wiringService) {
    wiringService = await Service.create({
      name: "Electrical Wiring",
      description: "Complete house and office wiring, circuit breaker fixing",
      category: electricalCat._id,
      priceType: "hourly",
      firstHourRate: 280,
      additionalHourRate: 200,
      transportFee: 30,
      cooperativeShare: 10,
      insuranceShare: 5,
      hourlyPrice: 280,
      isActive: true,
    });
  }

  let tapService = await Service.findOne({ name: "Tap Repair" });
  if (!tapService) {
    tapService = await Service.create({
      name: "Tap Repair",
      description: "Tap repair, washer replacement, and leak stoppage",
      category: plumbingCat._id,
      priceType: "hourly",
      firstHourRate: 250,
      additionalHourRate: 180,
      transportFee: 30,
      cooperativeShare: 10,
      insuranceShare: 5,
      hourlyPrice: 250,
      isActive: true,
    });
  }

  let pipeEmergencyService = await Service.findOne({ name: "Pipe Leakage & Drainage Emergency" });
  if (!pipeEmergencyService) {
    pipeEmergencyService = await Service.create({
      name: "Pipe Leakage & Drainage Emergency",
      description: "Emergency burst pipe, high-pressure leak repair, and drain unclogging",
      category: plumbingCat._id,
      priceType: "hourly",
      firstHourRate: 350,
      additionalHourRate: 250,
      transportFee: 30,
      cooperativeShare: 10,
      insuranceShare: 5,
      hourlyPrice: 350,
      emergencyAvailable: true,
      emergencyFee: 100,
      isActive: true,
    });
  }

  let furnitureService = await Service.findOne({ name: "Furniture Assembly & Woodwork" });
  if (!furnitureService) {
    furnitureService = await Service.create({
      name: "Furniture Assembly & Woodwork",
      description: "Custom carpentry, cabinet repairs, hinges and wooden fixtures",
      category: carpentryCat._id,
      priceType: "hourly",
      firstHourRate: 300,
      additionalHourRate: 220,
      transportFee: 30,
      cooperativeShare: 10,
      insuranceShare: 5,
      hourlyPrice: 300,
      isActive: true,
    });
  }

  // 3. Ensure Cooperatives exist
  let mainCoop = await Cooperative.findOne({ cooperativeName: "das and co" });
  if (!mainCoop) {
    mainCoop = await Cooperative.findOne();
  }

  // Ensure a partner cooperative exists for realistic inter-cooperative exchange
  let partnerCoop = await Cooperative.findOne({ cooperativeName: "Kanyakumari Artisans & Trades Cooperative Society" });
  if (!partnerCoop) {
    let partnerUser = await User.findOne({ email: "artisans.coop@kanyakumari.org" });
    if (!partnerUser) {
      partnerUser = await User.create({
        name: "Kanyakumari Trades Union",
        email: "artisans.coop@kanyakumari.org",
        password: "$2a$10$abcdefghijklmnopqrstuvwx",
        role: [UserRole.COOPERATIVE],
        phone: "9443123456",
        accountStatus: AccountStatus.ACTIVE,
      });
    }

    partnerCoop = await Cooperative.create({
      userId: partnerUser._id,
      cooperativeName: "Kanyakumari Artisans & Trades Cooperative Society",
      cooperativeAddress: "Main Road, Nagercoil, Kanyakumari District",
      cooperativePhone: "9443123456",
      cooperativeEmail: "artisans.coop@kanyakumari.org",
      verificationStatus: VerificationStatus.APPROVED,
      cooperativeLogo: {
        url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600&auto=format&fit=crop&q=60",
        publicId: "dev_logo_seed",
      },
      verificationCertificate: {
        url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=60",
        publicId: "dev_cert_seed",
      },
    });
    console.log("Created partner cooperative:", partnerCoop.cooperativeName);
  }

  // 4. Ensure real workers exist
  const existingWorkers = await Worker.find().populate("userId").lean();
  console.log(`Found ${existingWorkers.length} existing workers.`);

  if (existingWorkers.length < 4 && mainCoop) {
    const newWorkerUsers = [
      {
        name: "Murugan Selvam",
        email: "murugan.electrician@gmail.com",
        phone: "9842109876",
        skill: wiringService._id,
        category: wiringService.category,
        address: "Kanyakumari Coastal Road",
        city: "kanyakumari",
        rating: 4.8,
        experience: 5,
      },
      {
        name: "Anand Kumar",
        email: "anand.carpenter@gmail.com",
        phone: "9789012345",
        skill: furnitureService._id,
        category: furnitureService.category,
        address: "Nagercoil Central Market",
        city: "kanyakumari",
        rating: 4.6,
        experience: 4,
      },
    ];

    for (const nw of newWorkerUsers) {
      let u = await User.findOne({ email: nw.email });
      if (!u) {
        u = await User.create({
          name: nw.name,
          email: nw.email,
          password: "$2a$10$abcdefghijklmnopqrstuvwx",
          role: [UserRole.WORKER, UserRole.CUSTOMER],
          phone: nw.phone,
          accountStatus: AccountStatus.ACTIVE,
        });
      }

      const existingW = await Worker.findOne({ userId: u._id });
      if (!existingW) {
        await Worker.create({
          userId: u._id,
          cooperativeId: mainCoop._id,
          category: nw.category,
          categories: nw.category ? [nw.category] : [],
          skills: [nw.skill],
          availability: AvailabilityStatus.FULL_TIME,
          verificationStatus: VerificationStatus.APPROVED,
          verificationDocuments: {
            identity: {
              url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
              status: VerificationStatus.APPROVED,
            },
            certificate: {
              url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400",
              status: VerificationStatus.APPROVED,
            },
          },
          experience: nw.experience,
          location: {
            address: nw.address,
            city: nw.city,
            state: "Tamil Nadu",
            pincode: "629001",
          },
          rating: nw.rating,
          totalJobsCompleted: 4,
          isActive: true,
        });
        console.log(`Created worker profile for: ${nw.name}`);
      }
    }
  }

  // Fetch all active workers now
  const allWorkers = await Worker.find({ isActive: true }).lean();
  const allCustomers = await User.find({ role: UserRole.CUSTOMER }).lean();
  const primaryCustomer = allCustomers[0] || (await User.findOne());

  if (!primaryCustomer) {
    console.error("No customer user available to assign bookings");
    return;
  }

  // 5. Populate Realistic Historical & Scheduled Bookings
  const currentBookingCount = await Booking.countDocuments();
  console.log(`Current bookings in DB: ${currentBookingCount}`);

  if (currentBookingCount < 60) {
    const servicesList = [
      { service: wiringService, category: electricalCat, hours: [8, 9, 10, 11, 16, 17, 18] },
      { service: tapService, category: plumbingCat, hours: [7, 8, 9, 10, 14, 15, 17, 19] },
      { service: pipeEmergencyService, category: plumbingCat, hours: [6, 7, 8, 9, 18, 19, 20] },
      { service: furnitureService, category: carpentryCat, hours: [10, 11, 12, 14, 15, 16] },
    ];

    const newBookingsToInsert: any[] = [];
    const now = new Date();

    // Generate ~50 historical bookings over the past 28 days
    for (let dayOffset = 28; dayOffset >= 1; dayOffset--) {
      const bookingsOnThisDay = 2 + (dayOffset % 3 === 0 ? 2 : 0) + (dayOffset % 7 === 0 || dayOffset % 7 === 6 ? 2 : 0);

      for (let b = 0; b < bookingsOnThisDay; b++) {
        const item = servicesList[(dayOffset + b) % servicesList.length];
        const zone = REAL_ZONES[(dayOffset * 3 + b) % REAL_ZONES.length];
        const assignedWorker = allWorkers[(dayOffset + b) % allWorkers.length];

        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - dayOffset);
        const randomHour = item.hours[b % item.hours.length];
        targetDate.setHours(randomHour, (b * 17) % 60, 0, 0);

        const isEmergency = item.service.name.includes("Emergency") && b % 2 === 0;
        const bookingType = isEmergency
          ? BookingType.EMERGENCY
          : b % 3 === 0
          ? BookingType.ON_DEMAND
          : BookingType.SCHEDULED;

        const rate = item.service.firstHourRate || 250;
        const transportFee = 30;
        const totalAmount = rate + transportFee;

        newBookingsToInsert.push({
          bookingNumber: `BKG-${targetDate.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          customer: primaryCustomer._id,
          service: item.service._id,
          category: item.category._id,
          cooperative: mainCoop?._id,
          worker: assignedWorker?._id,
          address: {
            street: zone,
            city: "Kanyakumari",
            state: "Tamil Nadu",
            pincode: "629001",
            landmark: "Near Market Junction",
            location: {
              type: "Point",
              coordinates: [77.5385 + (b * 0.01), 8.0883 + (b * 0.01)],
            },
          },
          scheduledDate: targetDate,
          customerNotes: `Realistic booking for ${item.service.name} at ${zone}`,
          bookingType,
          isEmergency,
          urgencyLevel: isEmergency ? UrgencyLevel.CRITICAL : UrgencyLevel.STANDARD,
          emergencyDetails: isEmergency
            ? {
                hazardType: "Burst Pipe & Water Flooding",
                severity: "CRITICAL",
                immediateContact: "9876543210",
                notes: "Water main leaking rapidly into kitchen",
              }
            : undefined,
          priceType: "hourly",
          rate,
          units: 1,
          totalAmount,
          pricing: {
            firstHourRate: rate,
            additionalHourRate: item.service.additionalHourRate || 180,
            transportFee,
            cooperativePercentage: 10,
            insurancePercentage: 5,
            actualDurationMinutes: 60,
            billableHours: 1,
            firstHourCharge: rate,
            additionalHoursCharge: 0,
            serviceAmount: rate,
            cooperativeShareAmount: Math.round(rate * 0.1),
            insuranceShareAmount: Math.round(rate * 0.05),
            workerNetEarnings: rate - Math.round(rate * 0.15) + transportFee,
            customerTotalAmount: totalAmount,
            isFinalized: true,
          },
          paymentStatus: PaymentStatus.PAID,
          status: BookingStatus.COMPLETED,
          assignedAt: targetDate,
          completedAt: new Date(targetDate.getTime() + 75 * 60000),
          createdAt: new Date(targetDate.getTime() - 120 * 60000),
        });
      }
    }

    // Generate ~20 bookings for today and the next 7 upcoming days
    for (let dayAhead = 0; dayAhead <= 7; dayAhead++) {
      const bookingsAhead = 2 + (dayAhead % 2 === 0 ? 1 : 0);

      for (let b = 0; b < bookingsAhead; b++) {
        const item = servicesList[(dayAhead + b + 1) % servicesList.length];
        const zone = REAL_ZONES[(dayAhead * 2 + b) % REAL_ZONES.length];
        const assignedWorker = b % 2 === 0 ? allWorkers[b % allWorkers.length] : undefined;

        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + dayAhead);
        const randomHour = item.hours[(b + 1) % item.hours.length];
        targetDate.setHours(randomHour, (b * 23) % 60, 0, 0);

        const rate = item.service.firstHourRate || 280;
        const transportFee = 30;
        const totalAmount = rate + transportFee;

        newBookingsToInsert.push({
          bookingNumber: `BKG-${targetDate.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          customer: primaryCustomer._id,
          service: item.service._id,
          category: item.category._id,
          cooperative: mainCoop?._id,
          worker: assignedWorker?._id,
          address: {
            street: zone,
            city: "Kanyakumari",
            state: "Tamil Nadu",
            pincode: "629001",
            landmark: "Main Junction",
            location: {
              type: "Point",
              coordinates: [77.5385 + (b * 0.01), 8.0883 + (b * 0.01)],
            },
          },
          scheduledDate: targetDate,
          customerNotes: `Scheduled assignment for ${item.service.name}`,
          bookingType: BookingType.SCHEDULED,
          isEmergency: false,
          urgencyLevel: UrgencyLevel.STANDARD,
          priceType: "hourly",
          rate,
          units: 1,
          totalAmount,
          pricing: {
            firstHourRate: rate,
            additionalHourRate: item.service.additionalHourRate || 180,
            transportFee,
            cooperativePercentage: 10,
            insurancePercentage: 5,
            actualDurationMinutes: 60,
            billableHours: 1,
            firstHourCharge: rate,
            additionalHoursCharge: 0,
            serviceAmount: rate,
            cooperativeShareAmount: Math.round(rate * 0.1),
            insuranceShareAmount: Math.round(rate * 0.05),
            workerNetEarnings: rate - Math.round(rate * 0.15) + transportFee,
            customerTotalAmount: totalAmount,
            isFinalized: false,
          },
          paymentStatus: PaymentStatus.PENDING,
          status: assignedWorker ? BookingStatus.CONFIRMED : BookingStatus.PENDING,
          assignedAt: assignedWorker ? targetDate : undefined,
          createdAt: now,
        });
      }
    }

    console.log(`Inserting ${newBookingsToInsert.length} realistic bookings into database...`);
    await Booking.insertMany(newBookingsToInsert);
    console.log("Realistic bookings inserted successfully!");
  }

  const finalBookingCount = await Booking.countDocuments();
  console.log(`\n=== SEED COMPLETED. Total Bookings in DB: ${finalBookingCount} ===`);

  await disconnectDB();
}

seed().catch(console.error);
