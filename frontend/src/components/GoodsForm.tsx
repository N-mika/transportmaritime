import { useState, useEffect, FC } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { AlertTriangle, CheckCircle, Edit, Loader2, Plus, Trash, XCircle } from "lucide-react";
import InputField from "./tools/InputField";
import { CashMovement, Goods, Notification, Reservation, ReservationFormData, TABLE_DATA_BASE } from "../data/type";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux";
import { v4 as uuid } from 'uuid';
import { setCashMouvement, setGoods, setReservation } from "../redux/feature/stJude";
import { closeReservationModal } from "../redux/feature/modalSlice";
import QrCode from "./tools/QrCode";
import { toast } from "react-toastify";
import { Input } from "./ui/input";
import { cashMouvementVoid, formeReservationVoid, reservationVoid } from "../data/dataVoid";
import Tables from "./tools/TableGoods";
import { inputFields } from "./goodsForms";
import { onAddService, onGetService, onUpdateService, onDeleteService } from "../data/service";
import useFinders from "../Tools/finders";
import ModalDialog from "./tools/ModalDialog";

interface SavedModalState {
  formData: ReservationFormData;
  currentGoods: Goods[];
  priceTotal: number;
  lotNumber: string;
  paymentMethod: string;
  paymentRef: string;
  readOnlyValue: string;
  addTypeCargo: string;
  editingCargoType: string | null;
  isCargoTypeOpen: boolean;
  showAddNewTypeCargo: boolean;
  idBoatSelected: string;
  weightTrip: number;
  timestamp: number;
  sessionId?: string;
}

interface ReservationFormProps {
  onClose?: () => void;
  idReservation: string
}

const ReservationForm: FC<ReservationFormProps> = ({ onClose, idReservation }) => {
  const [currentGoods, setCurrentGoods] = useState<Goods[]>([]);
  const [priceTotal, setPrice] = useState<number>(0);
  const [lotNumber, setLotNumber] = useState("");
  const [addTypeCargo, setAddTypeCargo] = useState<string>('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [currenReservation, setCurrentReservation] = useState<Reservation>(reservationVoid);
  const [cashMouvement, setCashMouvements] = useState<CashMovement>(cashMouvementVoid);
  const [formData, setFormData] = useState<ReservationFormData>(formeReservationVoid);
  const [idBoatSelected, setIdBoat] = useState<string>('');
  const [weightTrip, setWeightTrip] = useState<number>(0);
  const [readOnlyValue, setReadOnlyValue] = useState<string>('');
  const [cargoTypes, setCargoTypes] = useState<string[]>([]);
  const [showAddNewTypeCargo, setShowAddNewTypeCargo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editingCargoType, setEditingCargoType] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("Espèces");
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [showModalDialog, setShowModalDialog] = useState<boolean>(false);
  const [idSelected, setIdSelected] = useState<string>('');
  const [isCargoTypeOpen, setIsCargoTypeOpen] = useState(false);
  const [currenReservationId, setCurrentReservationId] = useState<string>(idReservation);

  const { isReservationModalOpen } = useSelector((state: RootState) => state.modal);
  const dispatch = useDispatch();

  const findLatestUnconfirmedReservation = () => {
    let latestKey = null;
    let latestData = null;
    let latestTimestamp = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('reservationModal_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            // Prendre la plus récente
            if (parsed.timestamp && parsed.timestamp > latestTimestamp) {
              latestTimestamp = parsed.timestamp;
              latestKey = key;
              latestData = data;
            }
          }
        } catch (error) {
          console.error("Erreur lors de la lecture:", error);
        }
      }
    }
    
    return latestKey && latestData ? { 
      key: latestKey, 
      data: latestData,
      id: latestKey.replace('reservationModal_', '')
    } : null;
  };

   useEffect(() => {
    if (isReservationModalOpen) {
      const latestReservation = findLatestUnconfirmedReservation();
      
      if (latestReservation) {
        try {
          const parsedState: SavedModalState = JSON.parse(latestReservation.data);
          
          setFormData(parsedState.formData || formeReservationVoid);
          setCurrentGoods(parsedState.currentGoods || []);
          setPrice(parsedState.priceTotal || 0);
          setLotNumber(parsedState.lotNumber || "");
          setPaymentMethod(parsedState.paymentMethod || "Espèces");
          setPaymentRef(parsedState.paymentRef || "");
          setReadOnlyValue(parsedState.readOnlyValue || "");
          setAddTypeCargo(parsedState.addTypeCargo || "");
          setEditingCargoType(parsedState.editingCargoType || null);
          setIsCargoTypeOpen(parsedState.isCargoTypeOpen || false);
          setShowAddNewTypeCargo(parsedState.showAddNewTypeCargo || false);
          setIdBoat(parsedState.idBoatSelected || '');
          setWeightTrip(parsedState.weightTrip || 0);
          
          // Utiliser l'ID trouvé au lieu du nouveau
          setCurrentReservationId(latestReservation.id);
          
          toast.info("Données restaurées depuis votre dernière session", {
            autoClose: 3000,
          });
          
        } catch (error) {
          console.error("Erreur lors de la restauration:", error);
          localStorage.removeItem(latestReservation.key);
          // En cas d'erreur, utiliser l'ID fourni
          setCurrentReservationId(idReservation);
          onReset();
        }
      } else {
        // Aucune réservation trouvée, utiliser l'ID fourni
        setCurrentReservationId(idReservation);
        onReset();
      }
    }
  }, [isReservationModalOpen]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currenReservationId) {
        const currentSessionId = sessionStorage.getItem('currentSessionId');
        const modalState: SavedModalState = {
          formData,
          currentGoods,
          priceTotal,
          lotNumber,
          paymentMethod,
          paymentRef,
          readOnlyValue,
          addTypeCargo,
          editingCargoType,
          isCargoTypeOpen,
          showAddNewTypeCargo,
          idBoatSelected,
          weightTrip,
          timestamp: Date.now(),
          sessionId: currentSessionId || undefined
        };

        try {
          localStorage.setItem(`reservationModal_${currenReservationId}`, JSON.stringify(modalState));
        } catch (error) {
          console.error("Erreur de sauvegarde dans localStorage:", error);
          // Gérer le dépassement de quota
          clearOldReservationData();
        }
      }
    }, 1000); // 1 seconde de debounce

    return () => clearTimeout(timeoutId);
  }, [
    formData, currentGoods, priceTotal, lotNumber, paymentMethod,
    paymentRef, readOnlyValue, addTypeCargo, editingCargoType,
    isCargoTypeOpen, showAddNewTypeCargo, idBoatSelected, weightTrip,
    currenReservationId
  ]);

  const clearOldReservationData = () => {
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('reservationModal_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.timestamp && (now - parsed.timestamp) > oneDayInMs) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    }
  };

  // Gestion de la session utilisateur
  useEffect(() => {
    // Créer un ID de session unique
    if (!sessionStorage.getItem('currentSessionId')) {
      const sessionId = uuid();
      sessionStorage.setItem('currentSessionId', sessionId);
    }
  }, []);

  const handleClose = () => {

    if (onClose) {
      onClose();
    }

    dispatch(closeReservationModal());
  };

  useEffect(() => {
    const checkAndCleanOldData = () => {
      // Nettoyer les données de plus de 24 heures
      const now = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('reservationModal_')) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              // Si vous avez sauvegardé un timestamp
              if (parsed.timestamp && (now - parsed.timestamp) > oneDayInMs) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            localStorage.removeItem(key);
          }
        }
      }
    };

    // Exécuter au chargement
    checkAndCleanOldData();

    // Exécuter toutes les heures
    const interval = setInterval(checkAndCleanOldData, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const openEditCargoType = (cargoType: string) => {
    setEditingCargoType(cargoType);
    setAddTypeCargo(cargoType);
    setShowAddNewTypeCargo(true);
  };

  const deleteCargoType = async (cargoType: string) => {
    try {
      setIsLoading(true);
      const response = await onGetService<any>(TABLE_DATA_BASE.CARGOTYPE);
      const cargoTypeToDelete = response.find((c: any) => c.name === cargoType);
      if (cargoTypeToDelete) {
        const result = await onDeleteService(TABLE_DATA_BASE.CARGOTYPE, cargoTypeToDelete.id);
        if (result === "success") {
          setCargoTypes((prev) => prev.filter((type) => type !== cargoType));
          toast.success("Type de marchandise supprimé !");
        } else {
          toast.error("Erreur lors de la suppression du type de marchandise");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const { findTrip, findBoat } = useFinders();

  const [idCashMouvement] = useState(() => uuid());
  const { trip: trips, goods: allGoods } = useSelector((state: RootState) => state.stJude);
  const currentUser = useSelector((state: RootState) => state.users.currentUser);

  // const now = new Date();
  // const Trips = trips.filter((trip) => new Date(trip.depart) > now);

  const handleInput = (field: keyof ReservationFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }
  const calculateDerivedValues = () => {
    const { quantity, unitWeight, unitPrice } = formData;

    // Poids total = quantité × poids unitaire
    const totalWeight = quantity && unitWeight ? quantity * unitWeight : 0;
    let totalPrice = 0;

    if (readOnlyValue === "option1") {
      // OPTION 1 → Forfaitaire
      // total = quantité × prix unitaire
      if (quantity && unitPrice) {
        totalPrice = quantity * unitPrice;
      }
    }

    if (readOnlyValue === "option2") {
      // OPTION 2 → Par kg
      // total = poids total × prix/kg
      if (totalWeight && unitPrice) {
        totalPrice = totalWeight * unitPrice;
      }
    }

    setFormData(prev => ({
      ...prev,
      totalWeight,
      totalPrice,
      amountToBePaidByClient: totalPrice
    }));
  };

  const totalWeightInTrip = () => {
    let goodsInTrip = allGoods.filter(({ tripId }) => tripId === formData.tripId);
    setWeightTrip(goodsInTrip.reduce((acc, { totalWeight }) => acc + Number(totalWeight), 0))
  }
  const payTotal = (total: number) => {
    formData.rest = 0;
    formData.amountPaidByClient = total;
    formData.paymentStatus = true;
    setFormData((prev) => ({ ...prev, amountPaidByClient: formData.amountPaidByClient, rest: formData.rest, paymentStatus: formData.paymentStatus }));
  }
  const calculatePrice = () => {
    let totalPrice = currentGoods.reduce((acc, { totalPrice }) => acc + Number(totalPrice), 0)
    setPrice(totalPrice);
  }
  const setCashMouvementFct = () => {
    let currentCashMouvement: CashMovement = {
      ...cashMouvement,
      credit: formData.amountPaidByClient,
      designation: `Paiement du client ${formData.senderName}`,
      userId: currentUser?.id ? currentUser.id : "",
    }
    setCashMouvements(currentCashMouvement)
  }
  const generateLotNumber = () => {
    const prefix =
      formData.cargoType === "fragile"
        ? "FR"
        : formData.cargoType === "agricultural"
          ? "AG"
          : "GN"
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substring(2, 4).toUpperCase()
    setLotNumber(`${prefix}${timestamp}${random}`)
  }

  const validateForm = () => {
    let newErrors: { [key: string]: string } = {}

    // Champs expéditeur/destinataire obligatoires
    const requiredFields = [
      "senderName",
      "senderPhone",
      "senderAddress",
      "recipientName",
      "recipientPhone",
      "recipientAddress",
      "cargoType",
      "invoiceNumber",
      ...inputFields.filter(f => f.required).map(f => f.key)
    ]

    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = "Ce champ est requis"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onAddCurrentGood = () => {
    if (!validateForm()) return;
    if (!readOnlyValue) {
      toast.error("Veuillez choisir un mode de calcul !");
      return;
    }
    if (!formData.unitPrice || formData.unitPrice <= 0) {
      toast.error("Veuillez saisir un prix unitaire !");
      return;
    }

    let goods: Goods = {
      id: uuid(),
      amountToPay: formData.amountToBePaidByClient,
      embarkDate: formData.dateOfGoodsEntry,
      itemName: formData.goods,
      quantity: formData.quantity,
      totalPrice: formData.totalPrice,
      totalWeight: formData.totalWeight, types: formData.cargoType,
      unitPrice: formData.unitPrice, unitWeight: formData.unitWeight,
      userId: currentUser?.id ? currentUser.id : "",
      reservationId: idReservation,
      status: false,
      state: "Prévu",
      numberLot: '',
      tripId: formData.tripId,
      calculationMethod: readOnlyValue as "option1" | "option2"
    };

    setCurrentGoods([...currentGoods, goods]);
    setFormData({
      ...formData,
      amountToBePaidByClient: 0,
      goods: '',
      quantity: 0,
      totalPrice: 0,
      totalWeight: 0,
      unitPrice: 0,
      unitWeight: 0
    })
  }
  const onAddReservation = async () => {
    if (currentGoods.length === 0 || !currenReservation) {
      toast.error("Aucune marchandise à ajouter ou réservation invalide.");
      return;
    }

    setIsLoading(true);
    try {
      // Déterminer si le paiement est confirmé automatiquement
      const isPaymentConfirmed = paymentMethod === "Espèces";

      const reservationWithPayment: Reservation = {
        ...currenReservation,
        paymentMethod,
        paymentRef: paymentMethod !== "Espèces" ? paymentRef : undefined,
        isConfirmed: isPaymentConfirmed,
        validatedBy: isPaymentConfirmed ? currentUser?.id : undefined,
        validatedAt: isPaymentConfirmed ? new Date() : null,
      };

      const promises = currentGoods.map(good =>
        onAddService(TABLE_DATA_BASE.GOODS, good)
      );

      promises.push(onAddService(TABLE_DATA_BASE.RESERVATION, reservationWithPayment));

      if (formData.amountPaidByClient !== 0 && isPaymentConfirmed) {
        const currentCashMouvement: CashMovement = {
          ...cashMouvement,
          type: "credit",
          id: idCashMouvement,
          date: new Date().toISOString(),
          tripId: currenReservation.tripId,
          designation: `Paiement ${paymentMethod} - ${formData.senderName}`,
          credit: formData.amountPaidByClient,
          userId: currentUser?.id || ""
        };
        promises.push(onAddService(TABLE_DATA_BASE.CASHMOVEMENT, currentCashMouvement));
      }

      if (formData.amountPaidByClient !== 0 && !isPaymentConfirmed) {
        const allUsers = await onGetService<any>(TABLE_DATA_BASE.USER);
        const owners = allUsers.filter((user: any) => user.role === "Propriétaire");
        owners.forEach((owner: any) => {
          const notification: Notification = {
            id: uuid(),
            userId: owner.id,
            content: `Paiement ${paymentMethod} de ${formData.amountPaidByClient} Ar en attente de validation - Client: ${formData.senderName}`,
            isRead: false,
            reservationId: currenReservationId,
            type: "payment_validation",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          promises.push(onAddService(TABLE_DATA_BASE.NOTIFICATION, notification));
        });
      }

      const results = await Promise.all(promises);

      // Vérifie si toutes ont réussi
      if (results.every(r => r === "success")) {
        dispatch(setGoods(currentGoods));
        dispatch(setReservation(reservationWithPayment));

        if (formData.amountPaidByClient !== 0 && isPaymentConfirmed) {
          dispatch(setCashMouvement({
            ...cashMouvement,
            id: idCashMouvement,
            date: new Date().toISOString(),
            tripId: currenReservation.tripId
          }));
        }
        localStorage.removeItem(`reservationModal_${currenReservationId}`);

        toast.success(
          isPaymentConfirmed
            ? "Réservation créée et paiement encaissé !"
            : "Réservation créée ! Paiement en attente de validation."
        );
      } else {
        toast.error("Une erreur est survenue lors de l'ajout de certaines données.");
      }
    } finally {
      onReset();
      handleClose();
      setIsLoading(false);
    }
  };

  const onReset = () => {
    setFormData(formeReservationVoid);
    setCurrentGoods([]);
    setPrice(0);
    setLotNumber("");
    setErrors({});
    setCurrentReservation(reservationVoid);
    setCurrentReservationId(idReservation);
  }
  const calculateReste = () => {
    formData.amountPaidByClient === 0 ? formData.rest = priceTotal : formData.rest = priceTotal - formData.amountPaidByClient;
    setFormData((prev) => ({ ...prev, rest: formData.rest }));
  }
  const setReservationData = () => {
    const isPaymentConfirmed = paymentMethod === "Espèces";
    const reservationDate = formData.date || new Date().toISOString();
    let reservation: Reservation = {
      id: currenReservationId,
      clientName: formData.senderName,
      clientTel: formData.senderPhone,
      clientAdresse: formData.senderAddress,
      destName: formData.recipientName,
      destTel: formData.recipientPhone,
      destAdresse: formData.recipientAddress,
      status: "En cours",
      date: reservationDate,
      quantity: currentGoods.reduce((acc, { quantity }) => acc + Number(quantity), 0),
      weight: currentGoods.reduce((acc, { totalWeight }) => acc + Number(totalWeight), 0),
      tripId: formData.tripId,
      amountPaid: formData.amountPaidByClient,
      amountToPay: currentGoods.reduce((acc, { totalPrice }) => acc + Number(totalPrice), 0) - formData.amountPaidByClient,
      paymentStatus: formData.amountToBePaidByClient === 0 ? false : true,
      totalPrice: currentGoods.reduce((acc, { totalPrice }) => acc + Number(totalPrice), 0),
      userId: currentUser?.id ? currentUser.id : "",
      idCashMovement: idCashMouvement,
      invoiceNumber: formData.invoiceNumber,
      paymentMethod: paymentMethod,
      paymentRef: paymentMethod !== "Espèces" ? paymentRef : undefined,
      isConfirmed: isPaymentConfirmed,
      validatedBy: isPaymentConfirmed ? currentUser?.id : undefined,
      validatedAt: isPaymentConfirmed ? new Date() : null,
    }
    setCurrentReservation(reservation);
  }
  // useEffect(() => { calculateUnitPrice() }, [formData.totalPrice]);
  useEffect(() => { setReservationData() }, [currentGoods, formData.amountPaidByClient, priceTotal]);
  useEffect(() => { calculateDerivedValues() }, [formData.quantity, formData.unitWeight, formData.unitPrice, formData.totalPrice]);
  useEffect(() => { calculatePrice() }, [currentGoods, formData.weight, formData.volume, formData.cargoType]);
  useEffect(() => { calculateReste(), setCashMouvementFct() }, [formData.amountPaidByClient, priceTotal]);
  useEffect(() => {
    let currentTrip = findTrip(formData.tripId);
    setIdBoat(currentTrip.boatId);
    totalWeightInTrip()
  }, [formData.tripId])
  const handleUpdateGood = (updatedGood: Goods) => {
    setCurrentGoods((prevGoods) =>
      prevGoods.map((good) => {
        if (good.id === updatedGood.id) {
          let totalPrice = 0;
          const totalWeight = updatedGood.quantity * updatedGood.unitWeight;
          // Utiliser le calculationMethod stocké dans la marchandise, pas readOnlyValue
          const calculationMethod = good.calculationMethod || updatedGood.calculationMethod;

          if (!calculationMethod) {
            toast.error("Mode de calcul manquant pour cette marchandise");
            return good;
          }
          // Calcul selon le mode stocké dans la marchandise
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
            calculationMethod: calculationMethod
          };
        }
        return good;
      })
    );
  };
  const onDeleteGood = (id: string) => {
    setCurrentGoods((prevGoods) => prevGoods.filter((good) => good.id !== id));
  };

  useEffect(() => {
    const fetchCargoTypes = async () => {
      try {
        const response = await onGetService<any>(TABLE_DATA_BASE.CARGOTYPE);
        setCargoTypes(response.map((c: any) => c.name));
      } catch (error) {
        console.error("Erreur de récupération des types de marchandise :", error);
      }
    };
    fetchCargoTypes();
  }, []);

  // Fonction d'ajout d'un nouveau type de marchandise dans la base
  const handleAddCargoType = async () => {
    if (!addTypeCargo.trim()) {
      toast.error("Veuillez entrer un nom de type de marchandise");
      return;
    }

    try {
      setIsLoading(true);
      const result = await onAddService(TABLE_DATA_BASE.CARGOTYPE, {
        id: uuid(),
        name: addTypeCargo,
        userId: currentUser?.id ?? "",
      });

      if (result === "success") {
        setCargoTypes((prev) => [...prev, addTypeCargo]);
        setAddTypeCargo("");
        setShowAddNewTypeCargo(false);
        toast.success("Nouveau type ajouté !");
      } else {
        toast.error("Erreur lors de l’ajout du type de marchandise");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCargoType = async () => {
    if (!addTypeCargo.trim() || !editingCargoType) {
      toast.error("Nom invalide ou type à modifier introuvable");
      return;
    }

    try {
      setIsLoading(true);

      const response = await onGetService<any>(TABLE_DATA_BASE.CARGOTYPE);
      const cargoToUpdate = response.find((c: any) => c.name === editingCargoType);

      if (!cargoToUpdate) {
        toast.error("Type de marchandise introuvable");
        return;
      }

      const result = await onUpdateService(TABLE_DATA_BASE.CARGOTYPE, {
        ...cargoToUpdate,
        name: addTypeCargo,
      });

      if (result === "success") {
        setCargoTypes((prev) =>
          prev.map((type) => (type === editingCargoType ? addTypeCargo : type))
        );
        toast.success("Type de marchandise modifié !");
        setAddTypeCargo("");
        setEditingCargoType(null);
        setShowAddNewTypeCargo(false);
      } else {
        toast.error("Erreur lors de la modification du type de marchandise");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const defaultCargoType = ["Marchandise générale", "Fragile", "Agricole"];

  const onResponse = (id: string) => {
    if (id) {
      deleteCargoType(id);
    }
    setShowModalDialog(false);
    setIdSelected('');
  };

  return (
    <>
      {isReservationModalOpen && (
        <div className="flex fixed items-center justify-center inset-0 flex-col p-2.5 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={handleClose}></div>
          <div className="z-50 w-[80%] space-y-6 overflow-auto bg-white p-6 rounded-lg max-h-[90vh]">
            {/* Expéditeur */}
            <Card>
              <CardHeader>
                <CardTitle className="font-semibold text-xl">
                  Informations Expéditeur
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="Nom complet" value={formData.senderName} error={errors.senderName} onChange={(v) => handleInput("senderName", v)} />
                <InputField label="Téléphone" value={formData.senderPhone} error={errors.senderPhone} onChange={(v) => handleInput("senderPhone", v)} />
                <InputField label="Adresse" value={formData.senderAddress} error={errors.senderAddress} onChange={(v) => handleInput("senderAddress", v)} />
              </CardContent>
            </Card>
            {/* Destinataire */}
            <Card>
              <CardHeader>
                <CardTitle className="font-semibold text-xl">Informations Destinataire</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="Nom complet" value={formData.recipientName} error={errors.recipientName} onChange={(v) => handleInput("recipientName", v)} />
                <InputField label="Téléphone" value={formData.recipientPhone} error={errors.recipientPhone} onChange={(v) => handleInput("recipientPhone", v)} />
                <InputField label="Adresse" value={formData.recipientAddress} error={errors.recipientAddress} onChange={(v) => handleInput("recipientAddress", v)} />
              </CardContent>
            </Card>
            {/* Marchandise */}
            <Card>
              <CardHeader>
                <CardTitle className="font-semibold text-xl"> Informations Marchandise</CardTitle>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2">
                    <Label>Date de réservation</Label>
                    <InputField
                      label=""
                      type="date"
                      value={formData.date || ""}
                      onChange={(v) => handleInput("date", v)}
                      error={errors.date}
                    />
                  </div>
                  <Label>Voyage prévu</Label>
                  <Select value={formData.tripId} onValueChange={(v) => handleInput('tripId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="..." />
                    </SelectTrigger>
                    <SelectContent>
                      {trips.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>{`${trip.from} → ${trip.to} ( ${new Date(trip.depart).toLocaleString('fr-Fr', {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })} )`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
                {/* <SelectField handleInput={handleInput} trips={trips}></SelectField> */}
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Select */}
                <div className="flex flex-col gap-2">
                  <Label>Type de marchandise</Label>
                  <Select
                    value={formData.cargoType}
                    open={isCargoTypeOpen}
                    onOpenChange={setIsCargoTypeOpen}
                    onValueChange={(v) => handleInput("cargoType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 overflow-y-auto">
                      {cargoTypes.map((cargoType, key) => (
                        <div key={key} className="flex items-center justify-between px-2 py-1 hover:bg-gray-100">
                          <SelectItem value={cargoType}>{cargoType}</SelectItem>
                          <div className="flex gap-1">
                            {/* Bouton Edit */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsCargoTypeOpen(false);
                                openEditCargoType(cargoType)
                              }}
                            >
                              <Edit size={16} />
                            </Button>

                            {/* Bouton Delete */}
                            {!defaultCargoType.includes(cargoType) && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setIsCargoTypeOpen(false);
                                  setIdSelected(cargoType);
                                  setShowModalDialog(true);
                                }}
                              >
                                <Trash size={16} />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-100"
                        onClick={() => setShowAddNewTypeCargo(true)}>
                        <span>Autre</span>
                        <Plus size={16} />
                      </div>
                    </SelectContent>
                  </Select>
                  {/* Ajout de nouveaux type de marchandise */}
                  {showAddNewTypeCargo && <div className="flex fixed items-center justify-center z-50 inset-0 bg-black/60" onClick={() => setShowAddNewTypeCargo(false)}>
                    <div className="flex flex-col gap-2 rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>

                      <InputField onChange={(v) => setAddTypeCargo(v)} value={addTypeCargo}></InputField>
                      <Button variant="default" onClick={editingCargoType ? handleEditCargoType : handleAddCargoType}>
                        {isLoading ? "Chargement..." : "Valider"}
                      </Button>
                    </div>
                  </div>}
                  {errors.cargoType && (<span className="text-red-500 text-sm">{errors.cargoType}</span>)}
                </div>

                {/* Choix du mode de calcul */}
                <div className="flex flex-col gap-2">
                  <Label>Mode de calcul</Label>
                  <Select
                    value={readOnlyValue}
                    onValueChange={(v) => {
                      setReadOnlyValue(v);
                      // Reset montant quand on change de mode
                      setFormData(prev => ({
                        ...prev,
                        unitPrice: 0,
                        totalPrice: 0
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir l’option de calcul" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1 : Forfaitaire (Qté × Prix unitaire)</SelectItem>
                      <SelectItem value="option2">Option 2 : Par kg (Poids total × Prix/kg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {errors.calculationMethod && (
                  <span className="text-red-500 text-sm">{errors.calculationMethod}</span>
                )}

                {/* Champs dynamiques */}
                {inputFields.map(({ key, label, type }) => (
                  <InputField key={key} label={label} type={type} value={formData[key as keyof typeof formData] || ""} error={errors[key]} onChange={(v) => handleInput(key as keyof ReservationFormData, v)} />
                ))}
                {/* Champs calculés */}
                <InputField label="Poids total" value={formData.totalWeight} readOnly />
                <div className="flex flex-col gap-2">
                  <Label>Moyen de payement</Label>
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
                    <Label>
                      Référence de paiement{" "}
                      {paymentMethod === "Chèque" ? "(Numéro de chèque)" : "(Numéro de transaction)"}
                    </Label>
                    <Input
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder={
                        paymentMethod === "Chèque"
                          ? "Numéro du chèque"
                          : `Numéro de transaction ${paymentMethod}`
                      }
                    />
                  </div>
                )}
                <InputField label="Montant payer par le client" type="number" value={formData.totalPrice} readOnly={true} />
                <InputField
                  label="Numéro de facture"
                  value={formData.invoiceNumber}
                  onChange={(v) => handleInput("invoiceNumber", v)}
                  error={errors.invoiceNumber}
                />
              </CardContent>
              <CardFooter className="flex justify-end gap-4">
                <Button variant="default" onClick={onAddCurrentGood} disabled={isLoading}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isLoading ? (<Loader2 className="animate-spin mr-2" size={18} />) : "Ajouter"}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </CardFooter>
            </Card>
            <div className="overflow-x-auto text-primary">
              <Tables currentGoods={currentGoods} reservationClient={formData.recipientName} onUpdateGood={handleUpdateGood} onDeleteGoods={onDeleteGood}></Tables>
            </div>
            {/* Actions */}
            <div className="flex flex-col gap-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">Information sur le bateau</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col px-3">
                      <div className="flex gap-2 py-2 justify-between">
                        <span>Poid supporter par le bateau :</span>
                        <span>{findBoat(idBoatSelected).capacity} T</span>
                      </div>
                      <div className="flex gap-2 py-2 justify-between">
                        <span>Poid restant : </span>
                        <span>{findBoat(idBoatSelected).capacity * 1000 - (weightTrip + currentGoods.reduce((acc, { totalWeight }) => acc + Number(totalWeight), 0))} Kg ou {(findBoat(idBoatSelected).capacity * 1000 - (weightTrip + currentGoods.reduce((acc, { totalWeight }) => acc + Number(totalWeight), 0))) / 1000} T</span>
                      </div>
                      <div className="flex gap-2 py-2 justify-between">
                        <span>Poid Actuelle :</span>
                        <span>{currentGoods.reduce((acc, { totalWeight }) => acc + Number(totalWeight), 0)} kg ou {(currentGoods.reduce((acc, { totalWeight }) => acc + Number(totalWeight), 0)) / 1000} T</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Étiquette + Prix */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">Actions rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col gap-3">
                      <Button onClick={() => payTotal(priceTotal)}>
                        Payer la totalité
                      </Button>
                      <Button onClick={generateLotNumber}>
                        Générer étiquette
                      </Button>
                    </div>
                    <div className="text-sm font-medium">
                      Numéro de lot :{" "}
                      <span className="font-bold">{lotNumber || "Non généré"}</span>
                    </div>
                    {lotNumber !== "" && <QrCode idendifiant={lotNumber} />}
                  </CardContent>
                </Card>
                {/* Paiement */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">Paiement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xl font-bold">Prix total : {priceTotal} Ar</div>
                    <div className="flex items-center gap-2">
                      <Label className="whitespace-nowrap">Montant payé :</Label>
                      <Input type="number" value={formData.amountPaidByClient} onChange={(v) => handleInput("amountPaidByClient", v.target.value)} className="w-40" />
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {formData.rest >= 0 ? (
                        <span className="text-green-600">Montant restant : {formData.rest} Ar</span>
                      ) : (
                        <span className="text-red-600">Le montant saisi est supérieur</span>
                      )}
                    </div>
                    {paymentMethod !== "Espèces" && formData.amountPaidByClient > 0 && (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle size={16} />
                        <span className="text-sm">
                          Paiement en attente de validation par le propriétaire
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              {/* Confirmer */}
              <Button className="px-6 py-6 text-lg" onClick={onAddReservation} disabled={isLoading}>
                {isLoading ? "Chargement..." : "Confirmer réservation"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {showModalDialog && (
        <ModalDialog
          action="delete"
          onClose={() => setShowModalDialog(false)}
          title="Suppression"
          type="CargoType"
          id={idSelected}
          onResponse={onResponse}
        />
      )}
    </>
  )
}

export default ReservationForm;