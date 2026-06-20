import Menu from "../model/Menu";

const menuItems = [
  {
    id: "dashboard",
    label: "Tableau de Bord",
    icon: "BarChart3",
    description: "Vue d'ensemble",
    permission: "dashboard:read"
  },
  {
    id: "merchandise",
    label: "Reservation",
    icon: "Package",
    description: "Gestion Marchandises",
    permission: "merchandise:manage",
  },
  {
    id: "casing",
    label: "Gestion Caisse",
    icon: "CreditCard",
    description: "Finances",
    permission: "caisse:manage",
  },
  {
    id: "boat",
    label: "Gestion de Bateau",
    icon: "Ship",
    description: "Bateau",
    permission: "boat:manage",
  },
  {
    id: "trajets",
    label: "Trajets",
    icon: "MapPin",
    description: "Navigation",
    permission: "trajets:manage",
  },
  {
    id: "employe",
    label: "Équipe",
    icon: "Users",
    description: "Personnel",
    permission: "users:manage",
  },
  {
    id: "profile",
    label: "Profil",
    icon: "User",
    description: "Mon compte",
    permission: "profile:read",
  },
  {
    id: "fueldManage",
    label: "Carburant",
    icon: "Fuel",
    description: "Gestion Carburant",
    permission: "fueldManage:manage",
  },
];

export const initializeMenus = async () => {
  const count = await Menu.countDocuments();
  if (count === 0) {
    await Menu.insertMany(menuItems);
    console.log(" Menus initialisés en base");
  }
};