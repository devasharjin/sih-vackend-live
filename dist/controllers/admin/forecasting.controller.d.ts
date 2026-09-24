import { Request, Response } from "express";
/**
 * Get platform-wide macro demand matrix and cross-cooperative telemetry
 */
export declare function getPlatformForecastingMatrix(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        platformForecasted7DayTotal: number;
        activePlatformWorkforce: number;
        totalHistoricalGigsFulfilled: number;
        modelHealth: {
            accuracyScore: number;
            mapeScore: number;
            trainingSamples: number;
            modelArchitecture: string;
            lastCalibratedAt: string;
            environmentalFactorsActive: string[];
        };
        crossCooperativeExchanges: {
            sourceCooperative: string;
            targetCooperative: string;
            recommendedWorkers: number;
            trade: string;
            reason: string;
            status: string;
        }[];
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get cross-cooperative workforce exchange recommendations
 */
export declare function getCrossCooperativeExchange(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        sourceCooperative: string;
        targetCooperative: string;
        recommendedWorkers: number;
        trade: string;
        reason: string;
        status: string;
    }[];
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Get AI forecasting model telemetry and performance indicators
 */
export declare function getEngineHealth(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        accuracyScore: number;
        mapeScore: number;
        trainingSamples: number;
        modelArchitecture: string;
        lastCalibratedAt: string;
        environmentalFactorsActive: string[];
    };
    message: string;
    status: number;
}, Record<string, any>>>;
/**
 * Trigger AI model retraining and dynamic prior recalibration
 */
export declare function retrainModel(req: Request, res: Response): Promise<Response<{
    success: boolean;
    data: null;
    message: string;
    status: number;
}, Record<string, any>> | Response<{
    success: boolean;
    data: {
        status: string;
        recalibratedAt: string;
        accuracyScore: number;
        mapeScore: number;
        processedHistoricalBookings: number;
        activePriorZones: number;
        message: string;
    };
    message: string;
    status: number;
}, Record<string, any>>>;
//# sourceMappingURL=forecasting.controller.d.ts.map