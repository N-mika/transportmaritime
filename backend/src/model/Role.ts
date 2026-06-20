import mongoose from "mongoose";
import {Role} from "../config/typeData";
import { auditPlugin } from "../Middleware/Audit";

const roleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true }, // nom unique du rôle
    description: { type: String },
    menus: [
      {
        type: String,
        ref: "Menu", // lien vers les menus autorisés
      },
    ],
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

roleSchema.plugin(auditPlugin, { collectionName: "Role" });
export default mongoose.model<Role>("Role", roleSchema);