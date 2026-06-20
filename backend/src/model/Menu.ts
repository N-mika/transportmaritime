import mongoose from "mongoose";
import { Menu } from "../config/typeData";

const menuSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  icon: { type: String, required: true },
  description: { type: String },
  permission: { type: String, required: true },
});

export default mongoose.model<Menu>("Menu", menuSchema);