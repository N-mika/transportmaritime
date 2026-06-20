import mongoose, { Schema } from "mongoose";
import { Notification } from "../config/typeData";

const notificationSchema = new Schema<Notification>({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  reservationId: { type: String  },
  type: { type: String  },
},
  {
    timestamps: true,
  }
);
export default mongoose.model<Notification>("notification", notificationSchema);