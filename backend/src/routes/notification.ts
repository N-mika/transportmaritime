import {Router} from "express";
import {
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification
} from "../controllers/stJude";

const router = Router();

// ==========================
//  Notification Routes
// ==========================
router.get("/notifications", getNotifications);
router.post("/notifications", createNotification);
router.put("/notifications/:id", updateNotification);
router.delete("/notifications/:id", deleteNotification);

export default router;