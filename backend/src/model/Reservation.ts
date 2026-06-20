import mongoose from "mongoose";
import { Reservation } from "../config/typeData";
import { auditPlugin } from "../Middleware/Audit";
const reservationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    clientName: { type: String, required: true },
    clientTel: { type: String, required: true },
    clientAdresse: { type: String, required: true },
    destName: { type: String, required: true },
    destTel: { type: String, required: true },
    destAdresse: { type: String, required: true },
    status: { type: String, required: true },
    date: { type: String, required: true },
    quantity: { type: Number, required: true },
    weight: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    amountToPay: { type: Number, required: true },
    paymentStatus: { type: Boolean, required: true },
    tripId: { type: String, required: true },
    userId: { type: String, required: true },
    idCashMovement: { type: String },
    invoiceNumber: { type: String, required: true, unique: true },
    paymentMethod: {
      type: String,
      enum: ["Espèces", "Orange Money", "MVola", "Airtel Money", "Chèque"],
      required: true,
      default: "Espèces",
    },
    paymentRef: { type: String },
    isConfirmed: {
      type: Boolean,
      default: true, // par défaut "true" pour Espèces (paiement direct)
    },
    validatedBy: { 
      type: String,
      default: null,
    },
    validatedAt: { 
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);
reservationSchema.plugin(auditPlugin , {collectionName : "Reservation"});
export default mongoose.model<Reservation>("Reservation", reservationSchema);
