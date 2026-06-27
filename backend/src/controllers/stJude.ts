import { Request, Response } from "express";
import Boat from "../model/Boat";
import Goods from "../model/Goods";
import Reservation from "../model/Reservation";
import Trip from "../model/Trip";
import CashMovement from "../model/CashMovement";
import FuelConsumption from "../model/FuelConsumption";
import User from "../model/User";
import Menu from "../model/Menu";
import { Document, Model } from "mongoose";
import Role from "../model/Role";
import bcrypt from "bcryptjs";
import OldUser from "../model/OldUser";
import CargoType from "../model/CargoType";
import Notification from "../model/Notification";
import Port from "../model/Port";

// GET ALL
const getAll =
  <T extends Document>(Model: Model<T>, name: string) =>
  async (req: Request, res: Response) => {
    try {
      const schemaPaths = Object.keys(Model.schema.paths);
      const sortField = schemaPaths.includes("depart")
        ? "depart"
        : schemaPaths.includes("date")
          ? "date"
          : "id";

      const data = await Model.find().sort({ [sortField]: -1 });
      res.status(200).json(data);
    } catch (err: any) {
      res.status(500).json({
        error: `Erreur lors de la récupération des ${name}: ${err.message}`,
      });
    }
  };

// GET BY ID
export const getUserById = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err: any) {
    res
      .status(500)
      .json({
        error: `Erreur lors de la récupération de l'utilisateur: ${err.message}`,
      });
  }
};

// CREATE
const createOne =
  <T extends Document>(Model: Model<T>, name: string) =>
  async (req: Request, res: Response) => {
    try {
      const userId = req.body.userId || "user";
      const data = { ...req.body, userId };
      if (Model.modelName === "User" && data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        data.password = hashedPassword;
      }
      const doc = await Model.create(data);
      res.status(201).json(doc);
    } catch (err: any) {
      res.status(400).json({
        error: `Erreur lors de la création du ${name}: ${err.message}`,
      });
    }
  };

// UPDATE
const updateOne =
  <T extends Document>(Model: Model<T>, name: string) =>
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const values = req.body;

    try {
      if (Model.modelName === "User") {
        // Récupérer l'utilisateur existant
        const existingUser: any = await Model.findOne({ id });

        if (!existingUser) {
          return res.status(404).json({ error: `${name} not found` });
        }

        //  changement de mot de passe
        if (values.oldPassword && values.newPassword) {
          const { oldPassword, newPassword } = values;

          // Comparer ancien mot de passe
          const isMatch = await bcrypt.compare(
            oldPassword,
            existingUser.password,
          );
          if (!isMatch) {
            return res
              .status(400)
              .json({ error: "Ancien mot de passe incorrect." });
          }

          // Vérifier que le nouveau mot de passe n'est pas identique
          const isSameAsOld = await bcrypt.compare(
            newPassword,
            existingUser.password,
          );
          if (isSameAsOld) {
            return res.status(400).json({
              error: "Le nouveau mot de passe doit être différent de l'ancien.",
            });
          }

          // Hasher le nouveau mot de passe
          const hashedPassword = await bcrypt.hash(newPassword, 10);
          values.password = hashedPassword;
          delete values.oldPassword;
          delete values.newPassword;
        }
        // si pas de changement de mot de passe
        else if (!values.password || values.password.trim() === "") {
          values.password = existingUser.password;
        } else if (values.password !== existingUser.password) {
          const hashedPassword = await bcrypt.hash(values.password, 10);
          values.password = hashedPassword;
        }
      }

      const doc = await Model.findOneAndUpdate(
        { id },
        { $set: values },
        { new: true, runValidators: true },
      );

      // if (!doc) {
      //   return res.status(404).json({ error: `${name} not found` });
      // }

      res.status(200).json(doc);
    } catch (err: any) {
      res.status(400).json({
        error: `Erreur lors de la mise à jour du ${name}: ${err.message}`,
      });
    }
  };

// DELETE
const deleteOne =
  <T extends Document>(Model: Model<T>, name: string) =>
  async (req: Request, res: Response) => {
    const id = req.params.id;

    console.log(id, Model);
    try {
      const doc = await Model.findOneAndDelete({ id });
      // if (!doc) {
      //   return res.status(404).json({ error: `${name} not found` });
      // }
      console.log(doc);
      res.status(200).json({ message: `${name} deleted successfully` });
    } catch (err: any) {
      res.status(400).json({
        error: `Erreur lors de la suppression du ${name}: ${err.message}`,
      });
    }
  };

// ========== EXPORTS ==========

// GET
export const getBoats = getAll(Boat, "boats");
export const getGoods = getAll(Goods, "goods");
export const getReservations = getAll(Reservation, "reservations");
export const getTrips = getAll(Trip, "trips");
export const getCashMovements = getAll(CashMovement, "cash movements");
export const getFuelConsumptions = getAll(FuelConsumption, "fuel consumptions");
export const getUsers = getAll(User, "users");
export const getMenus = getAll(Menu, "menus");
export const getRoles = getAll(Role, "roles");
export const getOldUsers = getAll(OldUser, "old users");
export const getCargoType = getAll(CargoType, "cargotypes");
export const getPorts = getAll(Port, "ports");
export const getNotifications = getAll(Notification, "notifications");

// CREATE
export const createBoat = createOne(Boat, "boat");
export const createGoods = createOne(Goods, "goods");
export const createReservation = createOne(Reservation, "reservation");
export const createTrip = createOne(Trip, "trip");
export const createUser = createOne(User, "users");
export const creatOldUser = createOne(OldUser, "old users");
export const createCashMovement = createOne(CashMovement, "cash movement");
export const createFuelConsumption = createOne(
  FuelConsumption,
  "fuel consumption",
);
export const createMenu = createOne(Menu, "menu");
export const createRole = createOne(Role, "role");
export const createCargoType = createOne(CargoType, "cargotype");
export const createPort = createOne(Port, "port");
export const createNotification = createOne(Notification, "notification");

// UPDATE
export const updateBoat = updateOne(Boat, "Boat");
export const updateGoods = updateOne(Goods, "Goods");
export const updateReservation = updateOne(Reservation, "Reservation");
export const updateTrip = updateOne(Trip, "Trip");
export const updateCashMovement = updateOne(CashMovement, "CashMovement");
export const updateFuelConsumption = updateOne(
  FuelConsumption,
  "FuelConsumption",
);
export const updateUser = updateOne(User, "User");
export const updateMenu = updateOne(Menu, "Menu");
export const updateRole = updateOne(Role, "Role");
export const updateCargoType = updateOne(CargoType, "Cargotype");
export const updatePort = updateOne(Port, "Port");
export const updateNotification = updateOne(Notification, "Notification");

// DELETE
export const deleteBoat = deleteOne(Boat, "Boat");
export const deleteGoods = deleteOne(Goods, "Goods");
export const deleteReservation = deleteOne(Reservation, "Reservation");
export const deleteTrip = deleteOne(Trip, "Trip");
export const deleteCashMovement = deleteOne(CashMovement, "CashMovement");
export const deleteFuelConsumption = deleteOne(
  FuelConsumption,
  "FuelConsumption",
);
export const deleteUser = deleteOne(User, "User");
export const deleteMenu = deleteOne(Menu, "Menu");
export const deleteRole = deleteOne(Role, "Role");
export const deleteCargoType = deleteOne(CargoType, "Cargotype");
export const deletePort = deleteOne(Port, "Port");
export const deleteNotification = deleteOne(Notification, "Notification");
