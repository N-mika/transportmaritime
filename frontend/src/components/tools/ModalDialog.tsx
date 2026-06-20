import { FC, useState } from "react";
import { XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { collectionLabels } from "../TranslateTechictTerms";

interface ModalDialogProps {
  onClose: () => void;
  title: string;
  type: "Trip" | "Goods" | "Reservation" | "Boat" | "CashMovement" | "FuelConsumption" | "User" | "Role" | "CargoType" | "Port";
  action: "delete" | "rename" | "update";
  id: string;
  onResponse: (id: string) => Promise<void> | void;
}

const ModalDialog: FC<ModalDialogProps> = ({ title, type, action, id, onClose, onResponse }) => {
  // Message par défaut selon l’action
  const actionMessage = {
    delete: `Êtes-vous sûr de vouloir supprimer ce ${collectionLabels[type]} ?`,
    rename: `Voulez-vous renommer ce ${collectionLabels[type]} ?`,
    update: `Voulez-vous mettre à jour ce ${collectionLabels[type]} ?`,
  }[action];

  const actionColor = action === "delete" ? "text-red-600" : action === "update" ? "text-blue-600" : "text-gray-700";
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onResponse(id);
      onClose();
    } catch (error) {
      console.error("Erreur pendant l’action :", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      {/* Fond semi-transparent */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Contenu de la modal */}
      <div className="relative z-65 bg-white rounded-2xl shadow-2xl w-[90%] max-w-md p-6 animate-fadeIn">
        {/* En-tête */}
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition">
            <XCircle size={22} />
          </button>
        </div>

        {/* Corps */}
        <div className="py-6 text-center space-y-3">
          <AlertTriangle className={`mx-auto ${actionColor}`} size={40} />
          <p className="text-gray-700">{actionMessage}</p>
        </div>

        {/* Pied de page */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            className={
              action === "delete"
                ? "bg-red-600 hover:bg-red-700"
                : action === "update"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-600 hover:bg-gray-700"
            }
            disabled={isLoading}
          >
            {isLoading ? (<Loader2 className="animate-spin mr-2" size={18} />) : action === "delete" ? ("Supprimer") : action === "update" ? ("Mettre à jour") : ("Renommer")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalDialog;
