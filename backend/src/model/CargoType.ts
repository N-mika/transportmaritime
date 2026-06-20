import mongoose from "mongoose";
import { CargoType } from "../config/typeData";
import { auditPlugin } from "../Middleware/Audit";

export const cargotypeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

cargotypeSchema.plugin(auditPlugin, { collectionName: "CargoType" })
export default mongoose.model<CargoType>("CargoType", cargotypeSchema);
