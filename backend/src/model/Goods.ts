import mongoose from "mongoose";
import { Goods } from "../config/typeData";
import { auditPlugin } from "../Middleware/Audit";
const goodsSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    itemName: { type: String, required: true },
    types: {type: String,required: true},
    embarkDate: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitWeight: { type: Number, required: true },
    totalWeight: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    amountToPay: { type: Number, required: true },
    status: { type: Boolean, required: true },
    state: { type: String, required: true },
    reservationId: { type: String, required: true },
    numberLot: { type: String },
    userId: { type: String, required: true },
    tripId: { type: String, required: true },
    calculationMethod: {
      type: String,
      required: true,
      enum: ["option1", "option2"]
    },
  },
  { timestamps: true }
);
goodsSchema.plugin(auditPlugin, { collectionName: "Goods" });
export default mongoose.model<Goods>("Goods", goodsSchema);
