import mongoose from "mongoose";
import { User } from "../config/typeData";
import { auditPlugin } from "../Middleware/Audit";

export const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    tel: { type: String, required: true },
    role: {
      type: String,
      ref: "Role",
      required: true,
    },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

userSchema.plugin(auditPlugin, { collectionName: "User" })
export default mongoose.model<User>("User", userSchema);
