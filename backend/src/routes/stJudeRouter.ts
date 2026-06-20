import { Router } from "express";
import {
  getBoats,
  getGoods,
  getReservations,
  getTrips,
  getCashMovements,
  getOldUsers,
  getFuelConsumptions,
  createBoat,
  createGoods,
  createReservation,
  createTrip,
  creatOldUser,
  createCashMovement,
  createFuelConsumption,
  updateBoat,
  updateGoods,
  updateReservation,
  updateTrip,
  updateCashMovement,
  updateFuelConsumption,
  deleteGoods,
  deleteBoat,
  deleteReservation,
  deleteTrip,
  deleteFuelConsumption,
  deleteCashMovement,
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  getMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  getRoles,
  createRole,
  deleteRole,
  updateRole,
  getUserById,
  createCargoType,
  deleteCargoType,
  getCargoType,
  updateCargoType,
  createPort,
  deletePort,
  getPorts,
  updatePort,
} from "../controllers/stJude";

const router = Router();

// ==========================
//  Boat Routes
// ==========================
router.get("/boats", getBoats);
router.post("/boats", createBoat);
router.put("/boats/:id", updateBoat);
router.delete("/boats/:id", deleteBoat);

// ==========================
//  Goods Routes
// ==========================
router.get("/goods", getGoods);
router.post("/goods", createGoods);
router.put("/goods/:id", updateGoods);
router.delete("/goods/:id", deleteGoods);

// ==========================
//  Reservation Routes
// ==========================
router.get("/reservations", getReservations);
router.post("/reservations", createReservation);
router.put("/reservations/:id", updateReservation);
router.delete("/reservations/:id", deleteReservation);

// ==========================
//  Trip Routes
// ==========================
router.get("/trips", getTrips);
router.post("/trips", createTrip);
router.put("/trips/:id", updateTrip);
router.delete("/trips/:id", deleteTrip);

// ==========================
//  Cash Movement Routes
// ==========================
router.get("/cashmovements", getCashMovements);
router.post("/cashmovements", createCashMovement);
router.put("/cashmovements/:id", updateCashMovement);
router.delete("/cashmovements/:id", deleteCashMovement);

// ==========================
//  Fuel Consumption Routes
// ==========================
router.get("/fuelconsumptions", getFuelConsumptions);
router.post("/fuelconsumptions", createFuelConsumption);
router.put("/fuelconsumptions/:id", updateFuelConsumption);
router.delete("/fuelconsumptions/:id", deleteFuelConsumption);

// ==========================
//  User Routes
// ==========================
router.get("/users", getUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/users/:id", getUserById);

// ==========================
//  Menu Routes
// ==========================
router.get("/menus", getMenus);
router.post("/menus", createMenu);
router.put("/menus/:id", updateMenu);
router.delete("/menus/:id", deleteMenu);

// ==========================
//  Role Routes
// ==========================
router.get("/roles", getRoles);
router.post("/roles", createRole);
router.put("/roles/:id", updateRole);
router.delete("/roles/:id", deleteRole);

// ========================
// olduser
// ========================
router.get("/oldusers", getOldUsers);
router.post("/oldusers", creatOldUser);

// ==========================
//  Cargo Type Routes
// ==========================
router.get("/cargotypes", getCargoType);
router.post("/cargotypes", createCargoType);
router.put("/cargotypes/:id", updateCargoType);
router.delete("/cargotypes/:id", deleteCargoType);

// ==========================
//  Port Routes
// ==========================
router.get("/ports", getPorts);
router.post("/ports", createPort);
router.put("/ports/:id", updatePort);
router.delete("/ports/:id", deletePort);


export default router;
