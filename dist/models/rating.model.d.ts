import { Document, Model, Types } from "mongoose";
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
    rating: number;
    review?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IRatingModel extends Model<IRating> {
    calculateAverageRating(workerId: Types.ObjectId | string): Promise<void>;
}
declare const Rating: IRatingModel;
export default Rating;
//# sourceMappingURL=rating.model.d.ts.map