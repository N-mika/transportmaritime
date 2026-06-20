import mongoose from "mongoose";
import { Trip } from "../config/typeData";
import { auditPlugin } from "../Middleware/Audit";
const tripSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    boatId: { type: String, required: true },
    depart: { type: String, required: true },
    arrive: { type: String, required: true },
    loadingStartDate: { type: String, required: false },
    from: { type: String, required: true },
    to: { type: String, required: true },
    status: { type: String, required: true },
    userId:{ type: String, required: true  },
  },
  { timestamps: true }
);
tripSchema.plugin(auditPlugin , {collectionName : "Trip"});
export default mongoose.model<Trip>("Trip", tripSchema);
