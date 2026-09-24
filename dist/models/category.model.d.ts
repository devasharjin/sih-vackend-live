import { Document, Model } from "mongoose";
export interface ICategory extends Document {
    name: string;
    slug: string;
    icon?: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const Category: Model<ICategory>;
export default Category;
//# sourceMappingURL=category.model.d.ts.map