"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIRECT_SERVICES = void 0;
const dns_1 = __importDefault(require("dns"));
dns_1.default.setServers(["8.8.8.8", "8.8.4.4"]);
dns_1.default.setDefaultResultOrder("ipv4first");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ quiet: true });
const database_1 = require("../config/database");
const service_model_1 = __importDefault(require("../models/service.model"));
exports.DIRECT_SERVICES = [
    {
        name: "Plumber",
        description: "Professional plumbing repairs, leak detection, pipe replacements, tap fixes, bathroom fittings, and drain unclogging.",
        priceType: "hourly",
        firstHourRate: 250,
        additionalHourRate: 180,
        transportFee: 30,
        cooperativeShare: 10,
        insuranceShare: 5,
        hourlyPrice: 250,
        emergencyAvailable: true,
        emergencyFee: 100,
        icon: "🚰",
        isActive: true,
    },
    {
        name: "Electrician",
        description: "Certified electrical wiring, short-circuit diagnostics, switchboards, lighting fixtures, circuit breakers, and fan installations.",
        priceType: "hourly",
        firstHourRate: 280,
        additionalHourRate: 200,
        transportFee: 30,
        cooperativeShare: 10,
        insuranceShare: 5,
        hourlyPrice: 280,
        emergencyAvailable: true,
        emergencyFee: 100,
        icon: "⚡",
        isActive: true,
    },
    {
        name: "Gardener",
        description: "Expert lawn mowing, hedge trimming, plant healthcare, landscaping, weeding, garden pruning, and soil preparation.",
        priceType: "hourly",
        firstHourRate: 220,
        additionalHourRate: 150,
        transportFee: 30,
        cooperativeShare: 10,
        insuranceShare: 5,
        hourlyPrice: 220,
        emergencyAvailable: false,
        emergencyFee: 0,
        icon: "🌱",
        isActive: true,
    },
    {
        name: "Carpenter",
        description: "Master woodwork fabrication, custom furniture repairs, door lock fitting, hinges, shelving, and wooden partitions.",
        priceType: "hourly",
        firstHourRate: 300,
        additionalHourRate: 220,
        transportFee: 30,
        cooperativeShare: 10,
        insuranceShare: 5,
        hourlyPrice: 300,
        emergencyAvailable: false,
        emergencyFee: 0,
        icon: "🪚",
        isActive: true,
    },
    {
        name: "Painter",
        description: "Interior and exterior wall painting, waterproof surface coating, wall putty application, color consultations, and detail touch-ups.",
        priceType: "hourly",
        firstHourRate: 240,
        additionalHourRate: 170,
        transportFee: 30,
        cooperativeShare: 10,
        insuranceShare: 5,
        hourlyPrice: 240,
        emergencyAvailable: false,
        emergencyFee: 0,
        icon: "🎨",
        isActive: true,
    },
    {
        name: "House Cleaner",
        description: "Thorough deep home sanitation, kitchen degreasing, bathroom scrubbing, floor polishing, and post-renovation cleanup.",
        priceType: "hourly",
        firstHourRate: 200,
        additionalHourRate: 150,
        transportFee: 30,
        cooperativeShare: 10,
        insuranceShare: 5,
        hourlyPrice: 200,
        emergencyAvailable: false,
        emergencyFee: 0,
        icon: "🧹",
        isActive: true,
    },
    {
        name: "Appliance Technician",
        description: "Fast diagnostics and repair for washing machines, refrigerators, microwaves, water purifiers, and AC units.",
        priceType: "hourly",
        firstHourRate: 320,
        additionalHourRate: 220,
        transportFee: 30,
        cooperativeShare: 10,
        insuranceShare: 5,
        hourlyPrice: 320,
        emergencyAvailable: true,
        emergencyFee: 100,
        icon: "🔧",
        isActive: true,
    },
    {
        name: "Mason",
        description: "Skilled brick masonry, plastering, ceramic tile alignment, concrete repair, wall crack sealing, and pathway paving.",
        priceType: "hourly",
        firstHourRate: 350,
        additionalHourRate: 250,
        transportFee: 30,
        cooperativeShare: 10,
        insuranceShare: 5,
        hourlyPrice: 350,
        emergencyAvailable: false,
        emergencyFee: 0,
        icon: "🧱",
        isActive: true,
    },
];
async function seedDirectServices() {
    await (0, database_1.connectDB)();
    console.log("Connected to MongoDB for direct trade services seeding...");
    for (const svc of exports.DIRECT_SERVICES) {
        const existing = await service_model_1.default.findOne({ name: svc.name });
        if (existing) {
            // Update fields
            Object.assign(existing, svc);
            await existing.save();
            console.log(`Updated existing service: ${svc.name}`);
        }
        else {
            await service_model_1.default.create(svc);
            console.log(`Created new direct trade service: ${svc.name}`);
        }
    }
    console.log("Direct trade services successfully populated!");
    await (0, database_1.disconnectDB)();
    process.exit(0);
}
if (require.main === module) {
    seedDirectServices().catch((err) => {
        console.error("Failed to seed direct trade services:", err);
        process.exit(1);
    });
}
//# sourceMappingURL=seedDirectServices.js.map