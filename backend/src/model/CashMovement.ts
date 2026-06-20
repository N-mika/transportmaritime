import mongoose from "mongoose";
import { CashMovement } from "../config/typeData";
import { auditPlugin } from "../Middleware/Audit";
const cashMovementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    designation: { type: String, required: true },
    credit: { type: Number, required: true },
    debit: { type: Number, required: true },
    tripId: { type: String },
    type: { type: String, enum: ["debit", "credit"], required: true },
    goodsId: { type: String },
    userId: { type: String, required: true },
    date: { type: String, required: true },
    paymentMode: {type: String},
    payer: {type: String}
  },
  { timestamps: true }
);

cashMovementSchema.plugin(auditPlugin , {collectionName : "CashMovement"});
export default mongoose.model<CashMovement>("CashMovement", cashMovementSchema);
