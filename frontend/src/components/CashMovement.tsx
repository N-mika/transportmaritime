import { FC, useEffect, useState } from "react";
import InputField from "./tools/InputField";
import { CashMovement, TABLE_DATA_BASE } from "../data/type";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { v4 as uuid } from 'uuid';
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux";
import { setCashMouvement } from "../redux/feature/stJude";
import { onAddService, onUpdateService } from "../data/service";
import { toast } from "react-toastify";
import HeadModale from "./tools/HeadModale";
import ModalDialog from "./tools/ModalDialog";
import DateTimeWheelSelector from "./DateTimeSelector";

interface PropsCashForm {
  onClose: () => void;
  type: "edit" | "add";
  cashMouvement: CashMovement;
}

const CashMovementForm: FC<PropsCashForm> = ({ onClose, type, cashMouvement }) => {
  const [stateCashMouvement, setCurrentCashMouvement] = useState<CashMovement>(cashMouvement);
  const [showModalDialog, setShowModalDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.users.currentUser);
  const trips = useSelector((state: RootState) => state.stJude.trip);
  const [errors, setErrors] = useState<{ date?: string; payer?: string; paymentMode?: string }>({});
  const reservations = useSelector((state: RootState) => state.stJude.reservation)
  const isLinkedToReservation = reservations.some(
    (res) => res.idCashMovement === stateCashMouvement.id
  );

  const STORAGE_KEY = `cashMovementModal_${stateCashMouvement.id || "new"}`;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          stateCashMouvement,
          timestamp: Date.now(),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        console.error("Erreur sauvegarde CashMovement:", error);
      }
    }, 800); // debounce

    return () => clearTimeout(timeoutId);
  }, [stateCashMouvement]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (parsed.stateCashMouvement) {
          setCurrentCashMouvement(parsed.stateCashMouvement);

          toast.info("Formulaire restauré automatiquement", {
            autoClose: 2500,
          });
        }
      } catch (error) {
        console.error("Erreur restauration CashMovement:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);


  /** 🔹 Met à jour les champs du formulaire */
  const handleInput = (field: keyof CashMovement, value: string | number) => {
    setCurrentCashMouvement((prev) => ({ ...prev, [field]: value }));
    if (field === "date") {
      setErrors((prev) => ({ ...prev, date: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: { date?: string; payer?: string; paymentMode?: string } = {};
    if (!stateCashMouvement.date || stateCashMouvement.date.trim() === "") {
      newErrors.date = "La date est obligatoire.";
    }
    if (!stateCashMouvement.payer || stateCashMouvement.payer.trim() === "") {
      newErrors.payer = "Le payeur est obligatoire.";
    }
    if (!stateCashMouvement.paymentMode || stateCashMouvement.paymentMode.trim() === "") {
      newErrors.paymentMode = "Le mode de paiement est obligatoire.";
    }

    setErrors(newErrors);

    // Retourne false s'il y a au moins une erreur
    return Object.keys(newErrors).length === 0;
  };


  /** 🔹 Envoi des données après confirmation */
  const onResponse = async (id?: string) => {
    if (isLoading) return; // <-- empêche double clic
    setIsLoading(true);

    try {
      const finalCashMouvement: CashMovement = {
        ...stateCashMouvement,
        id: id || stateCashMouvement.id || uuid(),
        date: stateCashMouvement.date,
        userId: currentUser?.id || "",
        debit: stateCashMouvement.type === "debit" ? stateCashMouvement.debit : 0,
        credit: stateCashMouvement.type === "credit" ? stateCashMouvement.credit : 0,
      };

      if (type === "add") {
        const response = await onAddService(TABLE_DATA_BASE.CASHMOVEMENT, finalCashMouvement);
        if (response === "success") {
          toast.success("Mouvement de caisse ajouté avec succès !");
          dispatch(setCashMouvement(finalCashMouvement));
          localStorage.removeItem(STORAGE_KEY);
          onClose();
        } else {
          toast.error("Erreur lors de l'ajout du mouvement de caisse.");
        }
      } else {
        const response = await onUpdateService(TABLE_DATA_BASE.CASHMOVEMENT, finalCashMouvement);
        if (response === "success") {
          toast.success("Mouvement de caisse modifié avec succès !");
          dispatch(setCashMouvement(finalCashMouvement));
          localStorage.removeItem(STORAGE_KEY);
          onClose();
        } else {
          toast.error("Erreur lors de la modification du mouvement de caisse.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Fond */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>

      {/* Contenu principal */}
      <div className="relative z-50 flex flex-col bg-white w-[50%] rounded-xl shadow-lg">
        <HeadModale
          tittle={type === "add" ? "Ajout des flux Monétaires" : "Modifier le flux Monétaire"}
        />

        <form className="flex p-6 flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          {/* Type */}
          <div className="flex flex-col gap-2">
            <Label>Type de Mouvement</Label>
            <Select
              value={stateCashMouvement.type}
              onValueChange={(v) => handleInput("type", v)}
              disabled={isLinkedToReservation}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debit">Débit</SelectItem>
                <SelectItem value="credit">Crédit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date du mouvement */}
          <div className="flex flex-col gap-1">
            <DateTimeWheelSelector
              label="Date du mouvement"
              value={stateCashMouvement.date || ""}
              onChange={(val) => handleInput("date", val)}
              error={errors.date}
            />
          </div>

          {/* Payeur */}
          <InputField
            label="Payeur"
            value={stateCashMouvement.payer}
            onChange={(v) => handleInput("payer", v)}
            error={errors.payer}
          />

          {/* Désignation */}
          <InputField
            label="Désignation"
            value={stateCashMouvement.designation}
            onChange={(v) => handleInput("designation", v)}

          />

          {/* Mode de paiement */}
          <InputField
            label="Mode de paiement"
            value={stateCashMouvement.paymentMode}
            onChange={(v) => handleInput("paymentMode", v)}
            error={errors.paymentMode}
          />

          {/* Montant */}
          {stateCashMouvement.type === "debit" ? (
            <InputField
              label="Montant Débit"
              type="number"
              value={stateCashMouvement.debit || ""}
              onChange={(v) => handleInput("debit", Number(v))}
            />
          ) : (
            <InputField
              label="Montant Crédit"
              type="number"
              value={stateCashMouvement.credit || ""}
              onChange={(v) => handleInput("credit", Number(v))}
            />
          )}

          {/* Voyage lié */}
          <div className="flex flex-col gap-2">
            <Label>En relation avec le voyage du</Label>
            <Select
              value={stateCashMouvement.tripId || ""}
              onValueChange={(v) => handleInput("tripId", v)}
              disabled={isLinkedToReservation}
            >
              <SelectTrigger>
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                {trips.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {`${trip.from} → ${trip.to} (${new Date(trip.depart).toLocaleDateString("fr-FR")})`}
                  </SelectItem>
                ))}
                <SelectItem value="none">Aucun</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Boutons d’action */}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!validateForm()) return;
                type === "edit" ? setShowModalDialog(true) : onResponse();
              }}
              disabled={isLoading}
            >
              {isLoading ? (type === "add" ? "Ajout..." : "Modification...") : type === "add" ? "Ajouter" : "Modifier"}
            </Button>
          </div>
        </form>
      </div>

      {/* 🔹 Modal de confirmation */}
      {showModalDialog && (
        <ModalDialog
          onClose={() => setShowModalDialog(false)}
          title={type === "add" ? "Confirmer l’ajout" : "Confirmer la modification"}
          type="CashMovement"
          action="update"
          id={stateCashMouvement.id || ""}
          onResponse={onResponse}
        />
      )}
    </div>
  );
};

export default CashMovementForm;
