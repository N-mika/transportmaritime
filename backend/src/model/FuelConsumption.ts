import mongoose from "mongoose";
import { FuelConsumption } from "../config/typeData";
import { auditPlugin } from "../Middleware/Audit";
const fuelConsumptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    tripId: { type: String, required: true },
    quantity: { type: Number, required: true },
    // fuelType: { type: String, required: true },
    fuelPrice: { type: Number, required: true },
    cost: { type: Number, required: true },
    userId: { type: String, required: true },
    remainingFuel: { type: Number },
    createdAt: { type: String },
  },
  { timestamps: true }
);

fuelConsumptionSchema.plugin(auditPlugin , {collectionName : "FuelConsumption"})
export default mongoose.model<FuelConsumption>(
  "FuelConsumption",
  fuelConsumptionSchema
);
