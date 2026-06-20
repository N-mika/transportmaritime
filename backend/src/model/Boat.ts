import mongoose from "mongoose";
import { Boat } from "../config/typeData";
import { auditPlugin } from "../Middleware/Audit";
const boatSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    userId: { type: String, required: true },
    state: {
      type: String,
      enum: [
        "En construction",
        "En service",
        "En maintenance",
        "En panne",
        "Désarmé",
        "Hors service",
      ],
      required: true,
    },
    crew: [{ type: String }], // liste d'IDs (ex: Users)
  },
  { timestamps: true }
);

boatSchema.plugin(auditPlugin, { collectionName: "Boat" });

export default mongoose.model<Boat>("Boat", boatSchema);
