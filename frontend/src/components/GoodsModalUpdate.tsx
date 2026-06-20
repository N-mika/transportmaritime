import { useState, FC, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { CashMovement, Goods, Reservation, TABLE_DATA_BASE } from "../data/type";
import { useDispatch, useSelector } from "react-redux";
import { deletGoods, setCashMouvement, setReservation, upDateGood } from "../redux/feature/stJude";
import Tables from "./tools/TableGoods";
import { RootState } from "../redux";
import { formatCurrency, hasChanges } from "../Tools/Tools";
import { v4 as uuid } from "uuid";
import { onDeleteService, onUpdateService, onAddService, onGetService } from "../data/service";
import { toast } from "react-toastify";
import useFinders from "../Tools/finders";
import InputField from "./tools/InputField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { AlertTriangle, CheckCircle, XCircle, Info, Plus } from "lucide-react";
import ModalDialog from "./tools/ModalDialog";
import GoodsModalAdd from "./GoodsModalAdd";

interface ReservationFormProps {
  onClose: () => void;
  currentReservation: Reservation;
  currentGoods: Goods[];
}
type PaymentMethod = "Espèces" | "Orange Money" | "MVola" | "Airtel Money" | "Chèque";

const UpdateGood: FC<ReservationFormProps> = ({ onClose, currentReservation, currentGoods }) => {
  const [reservationState, setReservationState] = useState<Reservation>(currentReservation);
  const [stateGoods, setStateGoods] = useState<Goods[]>(currentGoods);
  const [idGoodsDeleted, setIdGoodsDeleted] = useState<string[]>([]);
  const [additionalePrice, setAdditionaleprice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>((currentReservation.paymentMethod as PaymentMethod) || "Espèces");
  const [paymentRef, setPaymentRef] = useState<string>(currentReservation.paymentRef || "");
  const [requiresValidation, setRequiresValidation] = useState<boolean>(false);
  const [hasPendingPayment, setHasPendingPayment] = useState<boolean>(!currentReservation.isConfirmed);
  const [showDeleteReservationModal, setShowDeleteReservationModal] = useState(false);
  const [showAddGoodsModal, setShowAddGoodsModal] = useState(false);
  const [newGoods, setNewGoods] = useState<Goods[]>([]);

  const { findBoat } = useFinders();

  const dispatch = useDispatch();
  const { cashMouvement, trip } = useSelector((state: RootState) => state.stJude);
  const currentUser = useSelector((state: RootState) => state.users.currentUser);
  const curretTripe = trip.find(({ id }) => id === currentReservation.tripId)

  // Vérifier s'il y a un paiement en attente de validation
  useEffect(() => {
    setHasPendingPayment(!currentReservation.isConfirmed && currentReservation.amountPaid > 0);
  }, [currentReservation]);

  // Calculer le prix total basé sur les marchandises actuelles
  const calculateTotalPrice = () => {
    const allGoods = [...stateGoods, ...newGoods];
    return allGoods.reduce((acc, g) => acc + Number(g.totalPrice), 0);
  };

  // Vérifier si le paiement nécessite une validation
  useEffect(() => {
    const needsValidation = paymentMethod !== "Espèces" && additionalePrice > 0;
    setRequiresValidation(needsValidation);
  }, [paymentMethod, additionalePrice]);

  // Gérer l'ajout d'une nouvelle marchandise
  const handleAddGood = (newGood: Goods) => {
    setNewGoods(prev => [...prev, newGood]);

    const allGoods = [...stateGoods, ...newGoods, newGood];
    const newWeight = allGoods.reduce((acc, g) => acc + Number(g.totalWeight || 0), 0);
    const newQuantity = allGoods.reduce((acc, g) => acc + Number(g.quantity || 0), 0);
    const newTotalPrice = allGoods.reduce((acc, g) => acc + Number(g.totalPrice || 0), 0);

    setReservationState(prev => ({
      ...prev,
      weight: newWeight,
      quantity: newQuantity,
      totalPrice: newTotalPrice,
      amountToPay: Math.max(0, newTotalPrice - prev.amountPaid),
    }));
  };

  const payTotal = () => {
    // Empêcher le paiement total s'il y a un paiement en attente
    if (hasPendingPayment) {
      toast.error("Impossible de payer le reste. Un paiement précédent est en attente de validation.");
      return;
    }

    const totalPrice = calculateTotalPrice();
    const montantRestant = Math.max(0, totalPrice - reservationState.amountPaid);

    setAdditionaleprice(montantRestant);
    setReservationState(prev => ({
      ...prev,
      amountToPay: 0,
    }));
  };

  const createPaymentNotification = async (reservationId: string, amount: number) => {
    try {
      const allUsers = await onGetService<any>(TABLE_DATA_BASE.USER);
      const owners = allUsers.filter((user: any) => user.role === "Propriétaire");

      const notificationPromises = owners.map((owner: any) => {
        const notification = {
          id: uuid(),
          userId: owner.id,
          content: `Paiement ${paymentMethod} de ${formatCurrency(amount)} en attente de validation - Client: ${reservationState.clientName}`,
          isRead: false,
          reservationId: reservationId,
          type: "payment_validation",
          paymentMethod: paymentMethod,
          paymentRef: paymentRef,
          amount: amount
        };
        return onAddService(TABLE_DATA_BASE.NOTIFICATION, notification);
      });

      await Promise.all(notificationPromises);
      return "success";
    } catch (error) {
      console.error("Erreur création notification:", error);
      return "error";
    }
  };

  const onUpdate = async () => {
    if (isLoading) return;

    // Empêcher l'ajout de nouveau paiement s'il y a un paiement en attente
    if (hasPendingPayment && additionalePrice > 0) {
      toast.error("Impossible d'ajouter un nouveau paiement. Un paiement précédent est en attente de validation.");
      return;
    }

    setIsLoading(true);
    try {
      const promises: Promise<"success" | "error">[] = [];

      const allGoods = [...stateGoods, ...newGoods];
      const goodsChanged = stateGoods.some((good) => {
        const originalGood = currentGoods.find((g) => g.id === good.id);
        return hasChanges(originalGood || {}, good, ["updatedAt", "createdAt", "_id"]);
      });
      const goodsDeleted = idGoodsDeleted.length > 0;
      const hasNewGoods = newGoods.length > 0;

      // Recalcul cohérent des montants
      const totalPrice = allGoods.reduce((acc, g) => acc + Number(g.totalPrice), 0);
      const totalWeight = allGoods.reduce((acc, g) => acc + Number(g.totalWeight || 0), 0);
      const totalQuantity = allGoods.reduce((acc, g) => acc + Number(g.quantity || 0), 0);
      const oldPaid = reservationState.amountPaid;
      const additionalPayment = Number(additionalePrice) || 0;

      // Calcul correct du nouveau montant payé et restant
      const newAmountPaid = Math.max(0, Number(oldPaid) + additionalPayment);
      const newAmountToPay = Math.max(0, totalPrice - newAmountPaid);

      // LOGIQUE CORRECTE ET SIMPLIFIÉE :
      const hasNewPayment = additionalPayment > 0;
      const isNewPaymentConfirmed = paymentMethod === "Espèces" && hasNewPayment;

      const updatedReservation: Reservation = {
        ...reservationState,
        weight: totalWeight,
        quantity: totalQuantity,
        totalPrice: totalPrice,
        amountPaid: newAmountPaid,
        amountToPay: newAmountToPay,
        paymentStatus: newAmountToPay === 0,
        paymentMethod: paymentMethod,
        paymentRef: paymentMethod !== "Espèces" ? paymentRef : undefined,
        // CORRECTION : Ne mettre à jour la validation que pour les nouveaux paiements
        isConfirmed: hasNewPayment ? isNewPaymentConfirmed : currentReservation.isConfirmed,
        validatedBy: hasNewPayment && isNewPaymentConfirmed ? currentUser?.id : currentReservation.validatedBy,
        validatedAt: hasNewPayment && isNewPaymentConfirmed ? new Date() : currentReservation.validatedAt,
      };

      const reservationChanged = hasChanges(currentReservation, updatedReservation, [
        "updatedAt", "createdAt", "_id", "paymentMethod", "paymentRef",
        "totalPrice", "amountPaid", "amountToPay", "paymentStatus", "weight",
      ]);

      // Vérifier si la date doit être obligatoire
      const somethingChanged =
        goodsChanged ||
        goodsDeleted ||
        reservationChanged ||
        additionalPayment > 0 ||
        hasNewGoods;

      // Vérifier si la date est différente de la date originale et pas aujourd'hui
      const today = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
      const dateModified = reservationState.date !== currentReservation.date;
      const isToday = reservationState.date === today;

      // Si quelque chose change → la date doit être modifiée ou être aujourd'hui
      if (somethingChanged && !dateModified && !isToday) {
        toast.error("La date doit être renseignée ou être celle du jour lorsque vous effectuez des modifications.");
        setIsLoading(false);
        return;
      }

      if (!goodsChanged && !goodsDeleted && !reservationChanged && additionalPayment === 0 && !hasNewGoods) {
        toast.info("Aucune modification détectée.");
        setIsLoading(false);
        return;
      }

      // AJOUTER LES NOUVELLES MARCHANDISES À LA BASE DE DONNÉES
      if (hasNewGoods) {
        for (const newGood of newGoods) {
          promises.push(onAddService(TABLE_DATA_BASE.GOODS, newGood));
          // Dispatch l'action Redux pour ajouter la marchandise
          dispatch(upDateGood(newGood));
        }
      }

      // Update goods
      if (goodsChanged) {
        for (const good of stateGoods) {
          const originalGood = currentGoods.find(g => g.id === good.id);
          if (originalGood && hasChanges(originalGood, good, ["updatedAt", "createdAt", "_id"])) {
            promises.push(onUpdateService(TABLE_DATA_BASE.GOODS, good));
            dispatch(upDateGood(good));
          }
        }
      }

      // Delete goods
      if (goodsDeleted) {
        for (const id of idGoodsDeleted) {
          promises.push(onDeleteService(TABLE_DATA_BASE.GOODS, id));
          dispatch(deletGoods(id));
        }
      }

      // Update reservation
      if (reservationChanged) {
        promises.push(onUpdateService(TABLE_DATA_BASE.RESERVATION, updatedReservation));
        dispatch(setReservation(updatedReservation));
      }

      // Gestion cohérente du CashMovement (uniquement pour les paiements confirmés)
      const currentCash = cashMouvement.find(({ id }) => reservationState.idCashMovement === id);

      if (additionalPayment > 0 && isNewPaymentConfirmed) {
        let newCash: CashMovement;

        if (currentCash) {
          // Mise à jour du mouvement de caisse existant
          newCash = {
            ...currentCash,
            credit: newAmountPaid,
            userId: currentUser?.id ?? "",
            date: new Date().toISOString(),
            designation: `Paiement ${paymentMethod} - ${reservationState.clientName}`,
            paymentMode: paymentMethod,
            payer: reservationState.clientName || "",
          };

          if (hasChanges(currentCash, newCash, ["updatedAt", "createdAt", "_id"])) {
            promises.push(onUpdateService(TABLE_DATA_BASE.CASHMOVEMENT, newCash));
            dispatch(setCashMouvement(newCash));
          }
        } else {
          // Création d'un nouveau mouvement de caisse
          newCash = {
            id: uuid(),
            credit: newAmountPaid,
            userId: currentUser?.id ?? "",
            date: new Date().toISOString(),
            tripId: reservationState.tripId,
            designation: `Paiement ${paymentMethod} - ${reservationState.clientName}`,
            type: "credit",
            debit: 0,
            paymentMode: paymentMethod,
            payer: reservationState.clientName || "",
          };

          const updatedReservationWithCash = {
            ...updatedReservation,
            idCashMovement: newCash.id
          };

          promises.push(onUpdateService(TABLE_DATA_BASE.RESERVATION, updatedReservationWithCash));
          dispatch(setReservation(updatedReservationWithCash));
          promises.push(onUpdateService(TABLE_DATA_BASE.CASHMOVEMENT, newCash));
          dispatch(setCashMouvement(newCash));
        }
      }

      // Créer une notification si paiement nécessite validation
      if (additionalPayment > 0 && !isNewPaymentConfirmed) {
        const notificationResult = await createPaymentNotification(updatedReservation.id, additionalPayment);
        if (notificationResult === "success") {
          toast.info("Paiement en attente de validation par le propriétaire");
        }
      }

      if (promises.length === 0 && !requiresValidation) {
        toast.info("Aucune modification à enregistrer.");
        setIsLoading(false);
        return;
      }

      const results = await Promise.all(promises);
      if (results.every((r) => r === "success") || (requiresValidation && results.length > 0)) {
        const successMessage = requiresValidation
          ? "Modification enregistrée ! Paiement en attente de validation."
          : "La réservation a été mise à jour avec succès !";

        toast.success(successMessage);
        setAdditionaleprice(0);
        setNewGoods([]);
        onClose();
      } else {
        toast.error("Une erreur s'est produite lors de la mise à jour");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur inattendue lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGood = (updatedGood: Goods) => {
    setStateGoods((prevGoods) => {
      const updatedGoods = prevGoods.map((good) => {
        if (good.id === updatedGood.id) {
          const calculationMethod = good.calculationMethod || updatedGood.calculationMethod;

          if (!calculationMethod) {
            toast.error("Mode de calcul manquant pour cette marchandise");
            return good;
          }
          let totalPrice = 0;
          const totalWeight = updatedGood.quantity * updatedGood.unitWeight;
          if (calculationMethod === "option1") {
            // Option 1 : Forfaitaire (Qté × Prix unitaire)
            totalPrice = updatedGood.quantity * updatedGood.unitPrice;
          } else if (calculationMethod === "option2") {
            // Option 2 : Par kg (Poids total × Prix/kg)
            totalPrice = totalWeight * updatedGood.unitPrice;
          }

          return {
            ...good,
            ...updatedGood,
            totalWeight: totalWeight,
            totalPrice: totalPrice,
          };
        }
        return good;
      });

      // Calcul cohérent des totaux
      const allGoods = [...updatedGoods, ...newGoods];
      const newWeight = allGoods.reduce((acc, { totalWeight }) => Number(totalWeight || 0) + acc, 0);
      const newQuantity = allGoods.reduce((acc, { quantity }) => Number(quantity || 0) + acc, 0);
      const totalPrice = allGoods.reduce((acc, g) => acc + Number(g.totalPrice || 0), 0);

      // Mise à jour correcte du montant restant
      setReservationState(prevReservation => ({
        ...prevReservation,
        weight: newWeight,
        quantity: newQuantity,
        totalPrice,
        amountToPay: Math.max(0, totalPrice - prevReservation.amountPaid),
      }));

      return updatedGoods;
    });
  };

  const onDeleteGoods = (idGoods: string) => {
    setStateGoods((prev) => {
      const updatedGoods = prev.filter(({ id }) => id !== idGoods);

      const allGoods = [...updatedGoods, ...newGoods];
      const newWeight = allGoods.reduce((acc, g) => acc + Number(g.totalWeight || 0), 0);
      const newQuantity = allGoods.reduce((acc, g) => acc + Number(g.quantity || 0), 0);
      const totalPrice = allGoods.reduce((acc, g) => acc + Number(g.totalPrice || 0), 0);

      // Mise à jour correcte du montant restant
      setReservationState(prevReservation => ({
        ...prevReservation,
        weight: newWeight,
        quantity: newQuantity,
        totalPrice,
        amountToPay: Math.max(0, totalPrice - prevReservation.amountPaid),
      }));

      return updatedGoods;
    });

    setIdGoodsDeleted((prev) => [...prev, idGoods]);
  };

  // useEffect pour synchroniser les calculs
  useEffect(() => {
    const totalPrice = calculateTotalPrice();
    setReservationState(prev => ({
      ...prev,
      totalPrice,
      amountToPay: Math.max(0, totalPrice - prev.amountPaid),
      paymentStatus: prev.amountPaid >= totalPrice,
    }));
  }, [stateGoods]);

  // Calcul en temps réel du montant restant pour l'affichage
  const currentAmountToPay = Math.max(0, calculateTotalPrice() - reservationState.amountPaid - additionalePrice);

  const canEdit = currentUser?.role === "Propriétaire";

  // Vérifier si on peut effectuer un nouveau paiement
  const canMakePayment = !hasPendingPayment || additionalePrice === 0;

  const onConfirmDeleteReservation = async () => {
    if (!canEdit) {
      toast.error("Seul le propriétaire peut supprimer une réservation.");
      setShowDeleteReservationModal(false);
      return;
    }

    try {
      setIsLoading(true);

      // 1. Supprimer les marchandises liées
      for (const good of stateGoods) {
        await onDeleteService(TABLE_DATA_BASE.GOODS, good.id);
        dispatch(deletGoods(good.id));
      }

      // 2. Supprimer le mouvement de caisse s’il existe
      if (reservationState.idCashMovement) {
        await onDeleteService(
          TABLE_DATA_BASE.CASHMOVEMENT,
          reservationState.idCashMovement
        );
      }

      // 3. Supprimer la réservation
      await onDeleteService(
        TABLE_DATA_BASE.RESERVATION,
        reservationState.id
      );

      toast.success("Réservation supprimée avec succès");
      setShowDeleteReservationModal(false);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression de la réservation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex fixed items-center justify-center inset-0 flex-col p-2.5 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

      <div className="z-50 w-full sm:w-[90%] md:w-[80%] lg:w-[70%] space-y-6 overflow-auto bg-white p-4 sm:p-6 rounded-lg max-h-[90vh]">

        {/* Table responsive */}
        {canEdit && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Marchandises ({stateGoods.length})</h3>
              <Button
                variant="default"
                onClick={() => setShowAddGoodsModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter des marchandises
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Tables
                currentGoods={[...stateGoods, ...newGoods]}
                reservationClient={currentReservation.destName}
                onUpdateGood={handleUpdateGood}
                onDeleteGoods={onDeleteGoods}
              />
            </div>
            {stateGoods.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucune marchandise dans cette réservation
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-4 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Paiement */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl font-semibold">Paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-1">
                  <span>Numéro de facture :</span>
                  <span className="font-bold">{reservationState.invoiceNumber}</span>
                </div>
                <div className="text-base sm:text-xl font-bold flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                  <span>Prix total : {formatCurrency(calculateTotalPrice())}</span>
                  {currentUser && currentUser.role !== "Capitaine" && (
                    <Button
                      onClick={payTotal}
                      className="w-full sm:w-fit"
                      disabled={hasPendingPayment}
                    >
                      Payer la totalité
                    </Button>
                  )}
                </div>
                <div className="flex gap-1">
                  <span>Montant déjà payé :</span>
                  <span className="font-bold">{formatCurrency(reservationState.amountPaid)}</span>
                </div>

                {/* Alerte paiement en attente */}
                {hasPendingPayment && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      Un paiement de {formatCurrency(currentReservation.amountPaid)} est en attente de validation.
                      Vous ne pouvez pas effectuer de nouveau paiement tant que celui-ci n'est pas validé.
                    </span>
                  </div>
                )}

                {/* Mode de paiement */}
                {currentUser && currentUser.role !== "Capitaine" && canMakePayment && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Mode de paiement</label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir le mode de paiement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Espèces">Espèces</SelectItem>
                          <SelectItem value="Orange Money">Orange Money</SelectItem>
                          <SelectItem value="MVola">MVola</SelectItem>
                          <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                          <SelectItem value="Chèque">Chèque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentMethod !== "Espèces" && (
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">
                          Référence de paiement{" "}
                          {paymentMethod === "Chèque" ? "(Numéro de chèque)" : "(Numéro de transaction)"}
                        </label>
                        <input
                          type="text"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          placeholder={
                            paymentMethod === "Chèque"
                              ? "Numéro du chèque"
                              : `Numéro de transaction ${paymentMethod}`
                          }
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <InputField
                        noFlexCol={true}
                        value={additionalePrice}
                        label="Montant à payer :"
                        type="number"
                        onChange={(v) => {
                          const value = Number(v || 0);
                          if (isNaN(value)) return;

                          const totalPrice = calculateTotalPrice();
                          const montantPossible = totalPrice - reservationState.amountPaid;
                          const montantValide = Math.max(0, Math.min(value, montantPossible));

                          setAdditionaleprice(montantValide);
                        }}
                        disabled={hasPendingPayment}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <InputField
                        noFlexCol={true}
                        label="Date :"
                        type="date"
                        value={reservationState.date ? reservationState.date.toString().substring(0, 10) : ""}
                        onChange={(value) =>
                          setReservationState({
                            ...reservationState,
                            date: value,
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {currentUser && currentUser.role !== "Capitaine" && !canMakePayment && additionalePrice === 0 && (
                  <div className="text-sm text-gray-500 italic">
                    Les champs de paiement sont désactivés car un paiement précédent est en attente de validation.
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  {/* Affichage cohérent du montant restant */}
                  {currentAmountToPay >= 0 ? (
                    <span className={currentAmountToPay === 0 ? "text-green-600" : "text-orange-600"}>
                      Montant restant :{" "}
                      <span className="font-bold">{formatCurrency(currentAmountToPay)}</span>
                      {currentAmountToPay === 0 && " - Payé en totalité"}
                    </span>
                  ) : (
                    <span className="text-red-600">
                      Erreur de calcul du montant
                    </span>
                  )}
                </div>

                {/* Alerte validation paiement */}
                {requiresValidation && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700">
                      Paiement en attente de validation par le propriétaire
                    </span>
                  </div>
                )}

                {/* Statut de confirmation */}
                {reservationState.isConfirmed && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Paiement confirmé et validé
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations de réservation */}
            <Card className="border rounded-lg overflow-hidden">
              <CardHeader className="bg-primary px-4 py-2">
                <CardTitle className="text-base sm:text-lg font-bold text-white">
                  Informations de la réservation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-sm sm:text-base">

                {/* Voyage */}
                <div className="flex flex-col sm:flex-row justify-between border-b pb-2">
                  <span className="font-semibold text-gray-700">Voyage :</span>
                  <div className="flex flex-col text-gray-600 text-right sm:text-left">
                    <span>
                      {curretTripe &&
                        `${curretTripe.from} → ${curretTripe.to} ( ${new Date(
                          curretTripe.depart
                        ).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })} )`}
                    </span>
                    <span>avec {findBoat(curretTripe?.boatId as string).name}</span>
                  </div>
                </div>

                {/* Poids */}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-gray-700">Poids total :</span>
                  <span className="text-gray-600">{reservationState.weight} kg</span>
                </div>

                {/* Expéditeur */}
                <div className="border-b pb-2">
                  <span className="font-semibold text-gray-700">Expéditeur :</span>
                  <div className="ml-2 mt-1 space-y-1 text-gray-600">
                    <div>Nom : {currentReservation.clientName}</div>
                    <div>Adresse : {currentReservation.clientAdresse}</div>
                    <div>Téléphone : {currentReservation.clientTel}</div>
                  </div>
                </div>

                {/* Destinataire */}
                <div className="pb-2">
                  <span className="font-semibold text-gray-700">Destinataire :</span>
                  <div className="ml-2 mt-1 space-y-1 text-gray-600">
                    <div>Nom : {currentReservation.destName}</div>
                    <div>Adresse : {currentReservation.destAdresse}</div>
                    <div>Téléphone : {currentReservation.destTel}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-4 mt-4">
            {canEdit && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteReservationModal(true)}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Supprimer la réservation
              </Button>
            )}

            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Annuler
            </Button>
            <Button
              onClick={onUpdate}
              disabled={isLoading || (hasPendingPayment && additionalePrice > 0)}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Chargement...
                </>
              ) : hasPendingPayment && additionalePrice > 0 ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Paiement précédent en attente
                </>
              ) : requiresValidation ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Enregistrer et demander validation
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirmer la modification
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      {/* Modal pour ajouter des marchandises */}
      {showAddGoodsModal && (
        <GoodsModalAdd
          reservationId={currentReservation.id}
          tripId={currentReservation.tripId}
          onClose={() => setShowAddGoodsModal(false)}
          onAdd={handleAddGood}
          reservationData={{
            clientName: currentReservation.clientName,
            clientTel: currentReservation.clientTel,
          }}
        />
      )}
      {/* Modal de suppression de réservation */}
      {showDeleteReservationModal && (
        <ModalDialog
          action="delete"
          title="Suppression de la réservation"
          type="Reservation"
          id={reservationState.id}
          onClose={() => setShowDeleteReservationModal(false)}
          onResponse={onConfirmDeleteReservation}
        />
      )}

    </div>
  );
};

export default UpdateGood;