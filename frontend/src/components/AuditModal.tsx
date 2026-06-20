import { FC, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { AuditLog } from "../data/type";
import { onGetService } from "../data/service";
import { formatDate } from "../Tools/Tools";
import { collectionLabels, fieldLabels } from "./TranslateTechictTerms";
import useFinders from "../Tools/finders";

// Props
interface AuditModalProps {
  onClose: () => void;
  idAfter: string;
  type: "Goods" | "User" | "Reservation" | "Trip" | "Boat" | "CashMovement" | "FuelConsumption" | "Role" | "CargoType";
}

// Fonction pour formater les valeurs selon leur type
const formatFieldValue = (key: string, value: any): string => {
  if (value === null || value === undefined) return "";

  // Si le champ est une date
  const dateKeys = ["createdAt","arrive", "updatedAt","depart", "embarkDate", "departDate", "arriveDate" ,"date"]; // toutes les clés dates
  if (dateKeys.includes(key)) {
    return formatDate(value);
  }


  // Booléens
  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }

  // Tableaux
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
};

const AuditModal: FC<AuditModalProps> = ({ onClose, type, idAfter }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const { findUser } = useFinders();

  useEffect(() => {
    const fetchData = async () => {
      const data = await onGetService<AuditLog>(`audit/${idAfter}`);
      console.log(data , idAfter)
      setLogs(data);
    };
    fetchData();
  }, [idAfter, type]);

  const renderDiff = (log: AuditLog) => {
    if (log.action === "create") {
      return (
        <div className="text-green-700">
          <p className="font-semibold">Création :</p>
          <ul className="list-disc pl-5">
            {Object.entries(log.after)
              .filter(([key]) => fieldLabels[key] !== "")
              .map(([key, value]) => (
                <li key={key}>
                  <span className="font-medium">{fieldLabels[key] || key}</span>: {formatFieldValue(key, value)}
                </li>
              ))}
          </ul>
        </div>
      );
    }

    if (log.action === "delete") {
      return (
        <div className="text-red-700">
          <p className="font-semibold">Suppression :</p>
          <ul className="list-disc pl-5">
            {Object.entries(log.before || {})
              .filter(([key]) => fieldLabels[key] !== "")
              .map(([key, value]) => (
                <li key={key}>
                  <span className="font-medium">{fieldLabels[key] || key}</span>: {formatFieldValue(key, value)}
                </li>
              ))}
          </ul>
        </div>
      );
    }

if (log.action === "update") {
  // liste des champs techniques à ignorer pour la comparaison
  const technicalFields = ["updatedAt", "createdAt", "_id", "__v"];

  // récupérer seulement les champs qui ont vraiment changé
  const changedKeys = Object.keys(log.after).filter((key) => {
    if (technicalFields.includes(key)) return false;
    const beforeVal = (log.before as any)?.[key];
    const afterVal = (log.after as any)?.[key];
    return beforeVal !== afterVal;
  });

  // si aucune vraie modification, ne rien afficher
  if (changedKeys.length === 0) return null;

  return (
    <div className="text-blue-700">
      <p className="font-semibold">Mise à jour :</p>
      <ul className="list-disc pl-5">
        {changedKeys.map((key) => {
          const beforeVal = (log.before as any)?.[key];
          const afterVal = (log.after as any)?.[key];
          return (
            <li key={key}>
              <span className="font-medium">{fieldLabels[key] || key}</span>:
              <span className="text-red-500 line-through ml-2">{formatFieldValue(key, beforeVal)}</span> →
              <span className="text-green-600 ml-2">{formatFieldValue(key, afterVal)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


    return null;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-black/50 bg-opacity-50 fixed inset-0" onClick={onClose}></div>
      <div className="flex flex-col bg-white rounded-lg shadow-lg p-6 z-10 max-h-[80vh] w-11/12 md:w-3/4 lg:w-1/2">
        <h2 className="text-2xl font-bold mb-4">Historique des actions - {collectionLabels[type]}</h2>

        <div className="space-y-6 ma-h-[65vh] overflow-auto">
          {logs.length === 0 && <p className="text-gray-500">Aucun audit trouvé.</p>}

          {logs.map((log) => {
            const user = findUser(log.userId);
            return (
              <div key={log._id} className="p-4 border rounded bg-gray-50 shadow-sm">
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">{`${user.name} ${user.lastName}`}</span> à {" "}
                  <span className="font-semibold">
                    {log.action === "create"
                      ? "ajouter"
                      : log.action === "update"
                        ? "modifier"
                        : "supprimer"}
                  </span>
                  {""} dans <span className="font-medium">{collectionLabels[log.collectionName]}</span>{" "}
                  {" "}
                  le {formatDate(log.createdAt)}
                </p>
                <div className="mt-2">{renderDiff(log)}</div>
              </div>
            );
          })}
        </div>

        <Button className="mt-6 self-end" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  );
};

export default AuditModal;
