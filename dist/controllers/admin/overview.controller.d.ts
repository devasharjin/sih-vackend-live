import { Request, Response } from "express";
export declare function getAdminPlatformOverview(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        kpis: {
            grossGtv: any;
            platformRevenue: any;
            welfareReservePool: any;
            totalWorkerPayouts: any;
            totalBookings: number;
            completedBookings: number;
            activeBookings: number;
            pendingBookings: number;
            cancelledBookings: number;
            totalCooperatives: number;
            approvedCooperatives: number;
            pendingCooperatives: number;
            totalWorkers: number;
            totalCustomers: number;
            totalUsers: number;
        };
        orderBreakdown: {
            emergencyCount: number;
            premiumCount: number;
            onDemandCount: number;
            scheduledCount: number;
            completedPercentage: number;
        };
        systemHealth: {
            status: string;
            databaseStatus: string;
            aiTelemetryStatus: string;
            uptimeHours: number;
            activeNodes: number;
        };
        recentActivity: {
            id: any;
            bookingNumber: any;
            customerName: any;
            serviceName: any;
            cooperativeName: any;
            amount: any;
            status: any;
            bookingType: any;
            isEmergency: boolean;
            scheduledDate: any;
            createdAt: any;
        }[];
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=overview.controller.d.ts.map