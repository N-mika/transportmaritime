import Role from "../model/Role";
import { v4 as uuidv4 } from "uuid";

const roleItems = [
  {
    id: uuidv4(),
    name: "Propriétaire",
    description: "Accès total au système.",
    menus: [
        "dashboard",
        "merchandise",
        "casing",
        "boat",
        "trajets",
        "employe",
        "profile",
    ],
    userId: "system-user",
  },
  {
    id: uuidv4(),
    name: "Gestionnaire",
    description: "Responsable des opérations quotidiennes.",
    menus: [
        "merchandise",
        "casing",
        "boat",
        "trajets",
        "employe",
        "profile",
    ],
    userId: "system-user",
  },
  {
    id: uuidv4(),
    name: "Capitaine",
    description: "Commandant de bord.",
    menus: [
        "trajets",
        "fueldManage",
        "profile",
    ],
    userId: "system-user",
  },
  {
    id: uuidv4(),
    name: "Agent",
    description: "Gestion des réservations et interactions avec les clients.",
    menus: [
        "merchandise",
        "trajets",
        "profile",
    ],
    userId: "system-user",
  },
];

export const initializeRoles = async () => {
  const count = await Role.countDocuments();
  if (count === 0) {
    await Role.insertMany(roleItems);
    console.log("✅ Roles initialisés en base");
  }
};