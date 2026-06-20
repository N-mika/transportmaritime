import Port from "../model/Port";
import { v4 as uuid } from "uuid";

const PortItems = [
    {
        id: uuid(),
        name: "Antalaha",
        userId: "system-user",
    },
    {
        id: uuid(),
        name: "Tamatave",
        userId: "system-user",
    },

];

export const initializePorts = async () => {
  try {
      const count = await Port.countDocuments();
      if (count === 0) {
        await Port.insertMany(PortItems);
        console.log(" Ports initialisés en base de données");
      } else {
        console.log(" Port déjà présent en base, aucune insertion effectuée");
      }
    } catch (error) {
      console.error(" Erreur lors de l’initialisation des ports :", error);
    }
};