import CargoType from "../model/CargoType";
import { v4 as uuid } from "uuid";

const cargotypeItems = [
  {
    id: uuid(),
    name: "Marchandise générale",
    userId: "system-user",
  },
  {
    id: uuid(),
    name: "Fragile",
    userId: "system-user",
  },
  {
    id: uuid(),
    name: "Agricole",
    userId: "system-user",
  },
];

export const initializeCargoTypes = async () => {
  try {
    const count = await CargoType.countDocuments();
    if (count === 0) {
      await CargoType.insertMany(cargotypeItems);
      console.log(" Types de marchandise initialisés en base de données");
    } else {
      console.log(
        " Type de marchandise déjà présent en base, aucune insertion effectuée",
      );
    }
  } catch (error) {
    console.error(
      " Erreur lors de l’initialisation des types de marchandise :",
      error,
    );
  }
};
