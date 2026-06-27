import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import stJudeRouter from "./routes/stJudeRouter";
import audit from "./routes/audit";
import auth from "./routes/auth";
import notificationRouter from "./routes/notification";
import { initializeMenus } from "./config/initMenu";
import { initializeRoles } from "./config/initRoles";
import { initializeAdmin } from "./config/initAdmin";
import { initializeCargoTypes } from "./config/initCargoType";
import { initializePorts } from "./config/initPort";

const PORT = process.env.PORT || 3000;

dotenv.config();
connectDB();
initializeMenus();
initializeRoles();
initializeAdmin();
initializeCargoTypes();
initializePorts();
const app = express();

app.use(express.json());
app.use(
  cors({
    // origin: "http://localhost:5173",
    origin: "https://transportmaritime.vercel.app/",
    credentials: true,
  }),
);
app.use("/api", auth, stJudeRouter, audit, notificationRouter);

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
