import { FC } from "react";
import AddGoodsOnlyForm from "./AddGoodsOnlyForm";
import { Goods } from "../data/type";
import { X } from "lucide-react";

interface GoodsModalAddProps {
  reservationId: string;
  tripId: string;
  onClose: () => void;
  onAdd: (good: Goods) => void;
  existingGoods?: Goods[];
  reservationData?: {
    clientName?: string;
    clientTel?: string;
  };
}

const GoodsModalAdd: FC<GoodsModalAddProps> = ({
  reservationId,
  tripId,
  onClose,
  onAdd,
  reservationData,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              Ajouter une marchandise
            </h2>
            {reservationData?.clientName && (
              <p className="text-sm text-gray-600 mt-1">
                Réservation : {reservationData.clientName}
                {reservationData.clientTel && ` • ${reservationData.clientTel}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <AddGoodsOnlyForm
          reservationId={reservationId}
          tripId={tripId}
          onSuccess={(good) => {
            onAdd(good);
            onClose(); // Fermer automatiquement après ajout
          }}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default GoodsModalAdd;