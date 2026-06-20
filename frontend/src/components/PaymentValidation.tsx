// components/PaymentValidationButton.tsx
import { FC, useState } from "react";
import { Button } from "./ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux";
import { toast } from "react-toastify";
import { onUpdateService, onGetService, onAddService } from "../data/service";
import { TABLE_DATA_BASE } from "../data/type";
import { setReservationsInStore, setCashMouvement } from "../redux/feature/stJude";
import { v4 as uuid } from 'uuid';

interface PaymentValidationButtonProps {
  reservation: any;
  onValidationComplete: () => void;
  id?: string;
}

const PaymentValidationButton: FC<PaymentValidationButtonProps> = ({
  reservation,
  onValidationComplete,
  id
}) => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state: RootState) => state.users);
  const [isLoading, setIsLoading] = useState(false);

  const handleValidatePayment = async () => {
    if (!currentUser) {
      toast.error("Vous devez être connecté pour valider un paiement");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Mettre à jour la réservation
      const updatedReservation = {
        ...reservation,
        isConfirmed: true,
        validatedBy: currentUser.id,
        validatedAt: new Date().toISOString()
      };

      // 2. Créer le mouvement de caisse
      const cashMovementId = uuid();
      const cashMovement = {
        id: cashMovementId,
        type: "credit" as const,
        date: new Date().toISOString(),
        tripId: reservation.tripId,
        designation: `Paiement ${reservation.paymentMethod} validé - ${reservation.clientName}`,
        credit: reservation.amountPaid,
        debit: 0,
        userId: currentUser.id,
        reservationId: reservation.id
      };

      // 3. Marquer toutes les notifications de cette réservation comme lues
      const allNotifications = await onGetService<any>(TABLE_DATA_BASE.NOTIFICATION);
      const reservationNotifications = allNotifications.filter(
        (notif: any) => notif.reservationId === reservation.id && notif.type === "payment_validation"
      );

      const promises = [
        onUpdateService(TABLE_DATA_BASE.RESERVATION, updatedReservation),
        onAddService(TABLE_DATA_BASE.CASHMOVEMENT, cashMovement),
        ...reservationNotifications.map((notif: any) =>
          onUpdateService(TABLE_DATA_BASE.NOTIFICATION, { ...notif, isRead: true })
        )
      ];

      const results = await Promise.all(promises);

      if (results.every(r => r === "success")) {
        // Mettre à jour le store Redux
        const allReservations = await onGetService<any>(TABLE_DATA_BASE.RESERVATION);
        dispatch(setReservationsInStore(allReservations));
        dispatch(setCashMouvement(cashMovement));

        toast.success("Paiement validé avec succès !");
        onValidationComplete();
      } else {
        toast.error("Erreur lors de la validation du paiement");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur serveur lors de la validation");
    } finally {
      setIsLoading(false);
    }
  };

  // Ne pas afficher le bouton si le paiement est déjà confirmé
  if (reservation.isConfirmed) {
    return null;
  }

  // Vérifier si l'utilisateur actuel est un propriétaire
  const isOwner = currentUser?.role === "Propriétaire";

  if (!isOwner) {
    return null;
  }

  return (
    <div id={id}>
      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleValidatePayment();
        }}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-700"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <CheckCircle className="h-4 w-4 mr-2" />
        )}
        Valider le paiement
      </Button>
    </div>
  );
};

export default PaymentValidationButton;