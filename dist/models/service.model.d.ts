import { Document, Model, Types } from "mongoose";
export type ServicePriceType = "hourly" | "meters";
export interface IService extends Document {
    name: string;
    description: string;
    category?: Types.ObjectId;
    icon?: string;
    priceType: ServicePriceType;
    firstHourRate: number;
    additionalHourRate: number;
    transportFee: number;
    cooperativeShare: number;
    insuranceShare: number;
    hourlyPrice?: number;
    metersPrice?: number;
    emergencyAvailable?: boolean;
    emergencyFee?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const Service: Model<IService>;
export default Service;
//# sourceMappingURL=service.model.d.ts.map