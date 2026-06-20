import { FC, useState, useEffect } from "react";
import { Goods, TABLE_DATA_BASE } from "../data/type";
import { Button } from "./ui/button";
import InputField from "./tools/InputField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { v4 as uuid } from "uuid";
import { onGetService } from "../data/service";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../redux";
import { CheckCircle, XCircle } from "lucide-react";

interface AddGoodsOnlyFormProps {
    reservationId: string;
    tripId: string;
    onSuccess: (good: Goods) => void;
    onClose: () => void;
}

const AddGoodsOnlyForm: FC<AddGoodsOnlyFormProps> = ({
    reservationId,
    tripId,
    onSuccess,
    onClose,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [cargoTypes, setCargoTypes] = useState<string[]>([]);
    const currentUser = useSelector((state: RootState) => state.users.currentUser);

    interface FormData {
        itemName: string;
        quantity: number;
        unitWeight: number;
        unitPrice: number;
        types: string;
        calculationMethod: "option1" | "option2" | "";
        reservationId: string;
        tripId: string;
        userId: string;
        numberLot: string;
        embarkDate: string;
    }

    const [form, setForm] = useState<FormData>({
        itemName: "",
        quantity: 0,
        unitWeight: 0,
        unitPrice: 0,
        types: "",
        calculationMethod: "",
        reservationId: reservationId,
        tripId: tripId,
        userId: currentUser?.id || "",
        numberLot: "",
        embarkDate: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {
        const fetchCargoTypes = async () => {
            try {
                const response = await onGetService<any>(TABLE_DATA_BASE.CARGOTYPE);
                setCargoTypes(response.map((c: any) => c.name));
            } catch (error) {
                console.error("Erreur de récupération des types de marchandise:", error);
                // Types par défaut
                setCargoTypes(["Marchandise générale", "Fragile", "Agricole"]);
            }
        };
        fetchCargoTypes();
    }, []);

    const calculateTotals = () => {
        const totalWeight = form.quantity * form.unitWeight;
        let totalPrice = 0;

        if (form.calculationMethod === "option1") {
            // Forfaitaire
            totalPrice = form.quantity * form.unitPrice;
        } else if (form.calculationMethod === "option2") {
            // Par kg
            totalPrice = totalWeight * form.unitPrice;
        }

        return { totalWeight, totalPrice };
    };

    const validateForm = () => {
        if (!form.itemName.trim()) {
            toast.error("Nom de la marchandise obligatoire");
            return false;
        }
        if (!form.quantity || form.quantity <= 0) {
            toast.error("Quantité invalide");
            return false;
        }
        if (!form.unitWeight || form.unitWeight <= 0) {
            toast.error("Poids unitaire invalide");
            return false;
        }
        if (!form.unitPrice || form.unitPrice <= 0) {
            toast.error("Prix unitaire invalide");
            return false;
        }
        if (!form.calculationMethod) {
            toast.error("Veuillez choisir un mode de calcul");
            return false;
        }
        if (!form.types) {
            toast.error("Veuillez choisir un type de marchandise");
            return false;
        }
        return true;
    };

    const onSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const { totalWeight, totalPrice } = calculateTotals();

            // S'assurer que calculationMethod est valide
            if (form.calculationMethod !== "option1" && form.calculationMethod !== "option2") {
                toast.error("Mode de calcul invalide");
                setIsLoading(false);
                return;
            }

            const newGood: Goods = {
                id: uuid(),
                itemName: form.itemName,
                quantity: form.quantity,
                unitWeight: form.unitWeight,
                unitPrice: form.unitPrice,
                totalWeight,
                totalPrice,
                types: form.types,
                calculationMethod: form.calculationMethod,
                reservationId: form.reservationId,
                tripId: form.tripId,
                userId: form.userId,
                status: false,
                state: "Prévu",
                numberLot: form.numberLot || "",
                embarkDate: form.embarkDate,
                amountToPay: totalPrice,
            };

            toast.success("Marchandise ajoutée à la liste");
            onSuccess(newGood);
            onClose();
        } catch (e) {
            console.error("Erreur:", e);
            toast.error("Erreur inattendue");
        } finally {
            setIsLoading(false);
        }
    };

    const { totalWeight, totalPrice } = calculateTotals();

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                    label="Nom de la marchandise *"
                    value={form.itemName}
                    onChange={(v) => setForm({ ...form, itemName: v })}
                    placeHolder="Ex: Riz, Ciment..."
                />

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Type de marchandise *</label>
                    <Select
                        value={form.types}
                        onValueChange={(v) => setForm({ ...form, types: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                            {cargoTypes.map((type, index) => (
                                <SelectItem key={index} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <InputField
                    type="number"
                    label="Quantité *"
                    value={form.quantity.toString()}
                    onChange={(v) => setForm({ ...form, quantity: Number(v) || 0 })}
                />

                <InputField
                    type="number"
                    label="Poids unitaire (kg) *"
                    value={form.unitWeight.toString()}
                    onChange={(v) => setForm({ ...form, unitWeight: Number(v) || 0 })}
                />

                <InputField
                    type="number"
                    label="Prix unitaire (Ar) *"
                    value={form.unitPrice.toString()}
                    onChange={(v) => setForm({ ...form, unitPrice: Number(v) || 0 })}
                />

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Mode de calcul *</label>
                    <Select
                        value={form.calculationMethod}
                        onValueChange={(v) => setForm({
                            ...form,
                            calculationMethod: v as "option1" | "option2"
                        })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="option1">Forfaitaire (Qté × Prix)</SelectItem>
                            <SelectItem value="option2">Par kg (Poids × Prix)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <InputField
                    type="date"
                    label="Date d'embarquement"
                    value={form.embarkDate}
                    onChange={(v) => setForm({ ...form, embarkDate: v })}
                />
            </div>

            {/* Affichage des calculs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                    <p className="text-sm text-gray-600">Poids total</p>
                    <p className="text-lg font-semibold">{totalWeight.toFixed(2)} kg</p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-600">Prix total</p>
                    <p className="text-lg font-semibold">{totalPrice.toLocaleString()} Ar</p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-600">Montant à payer</p>
                    <p className="text-lg font-semibold">{totalPrice.toLocaleString()} Ar</p>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Annuler
                </Button>
                <Button variant="default" onClick={onSubmit} disabled={isLoading}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isLoading ? "Ajout..." : "Ajouter à la liste"}
                </Button>
            </div>
        </div>
    );
};

export default AddGoodsOnlyForm;