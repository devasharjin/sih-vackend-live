import { Document, Model, Types } from "mongoose";
export declare enum RebalancePlanStatus {
    RECOMMENDED = "RECOMMENDED",
    APPROVED = "APPROVED",
    EXECUTED = "EXECUTED",
    DISMISSED = "DISMISSED"
}
export interface IWorkforceRebalancePlan extends Document {
    planNumber: string;
    cooperative: Types.ObjectId;
    title: string;
    targetDate: Date;
    targetTrade: string;
    sourceZone: string;
    targetZone: string;
    recommendedWorkersCount: number;
    surgeBonusPerWorker: number;
    status: RebalancePlanStatus;
    aiRationale: string;
    mobilizedWorkers: Types.ObjectId[];
    executedAt?: Date;
    executedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const WorkforceRebalancePlan: Model<IWorkforceRebalancePlan>;
export default WorkforceRebalancePlan;
//# sourceMappingURL=workforcePlan.model.d.ts.map