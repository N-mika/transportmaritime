import mongoose from "mongoose";
import { Port } from "../config/typeData";
import { auditPlugin } from "../Middleware/Audit";

export const PortSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

PortSchema.plugin(auditPlugin, { collectionName: "Port" })
export default mongoose.model<Port>("Port", PortSchema);
