import { FC, FormEvent, useState } from "react";
import InputField  from "./tools/InputField";
import { Button } from "./ui/button";
import { Boat, TABLE_DATA_BASE } from "../data/type";
import { useDispatch, useSelector } from "react-redux";
import { setBoat as setBoats } from "../redux/feature/stJude";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "./ui/select";
import { Label } from "./ui/label";
import { RootState } from "../redux";
import { onAddService, onUpdateService } from "../data/service";
import { toast } from "react-toastify";
import { FieldDefinition, hasChanges, validateForm } from "../Tools/Tools";
import HeadModale from "./tools/HeadModale";
import { X } from "lucide-react";

const inputFields: FieldDefinition<Boat>[] = [
  { key: "id", label: "Matricule", type: "text", required: true, placeHolder: "Ex : MA-1234TA" },
  { key: "name", label: "Nom", type: "text", required: true, placeHolder: 'Ex : St Jude' },
  { key: "capacity", label: "Capacité en tonage (T)", required: false, type: "number", },
];

interface BoatModalProps {
  onClose: () => void;
  currentBoatSelected: Boat;
  type: "add" | "edit";
}

const BoatModal: FC<BoatModalProps> = ({ onClose, currentBoatSelected, type }) => {
  const [boat, setBoat] = useState<Boat>(currentBoatSelected);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const { allUser: capitaines, currentUser } = useSelector((state: RootState) => state.users);
  const capitaine = capitaines.filter(({ role }) => role === "Capitaine");

  const handleInput = (field: keyof Boat, value: string) => {
    setBoat(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const onSubmitData = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const validationErrors = validateForm(boat, inputFields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }
    setIsLoading(true);
    try {
      if (type === "edit") {

        const updatedBoat: Boat = {
          ...boat,
          userId: currentUser ? currentUser.id : "",
        };

        if (!hasChanges(updatedBoat, currentBoatSelected)) {
          toast.info("Aucune modification apportée au bateau.");
          onClose();
          return;
        }

        const response = await onUpdateService(TABLE_DATA_BASE.BOAT, updatedBoat);
        if (response === "success") {
          dispatch(setBoats(updatedBoat));
          toast.success("Bateau modifié avec succès !");
          onClose();
        } else {
          toast.error("Erreur lors de la modification du bateau.");
        }
      };
      if (type === "add") {
        const currentBoat: Boat = {
          ...boat,
          userId: currentUser ? currentUser.id : "",
        };

        const response = await onAddService(TABLE_DATA_BASE.BOAT, currentBoat);

        if (response === "success") {
          dispatch(setBoats(currentBoat));
          toast.success("Bateau ajouté avec succès !");
          onClose();
        } else {
          toast.error("Erreur lors de l'ajout du bateau.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center inset-0 fixed z-50">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="w-[50%] flex flex-col relative z-50 rounded-lg shadow-lg bg-white">
        <HeadModale tittle={type === "edit" ? `Modifier le bateau : ${boat.name || "—"}` : 'Ajouter un bateau'} />
        <form className="flex flex-col gap-4 p-6 " onSubmit={onSubmitData}>
          <div className="absolute text-white top-4 right-4" onClick={onClose}>
            <X className="w-5 h-5 " />
          </div>
          {inputFields.map(({ key, label, type, placeHolder }) => (
            <InputField
              key={key}
              label={label}
              error={errors[key]}
              type={type}
              value={boat[key as keyof Boat] || ""}
              placeHolder={placeHolder}
              onChange={(e) => handleInput(key as keyof Boat, e)}
            />
          ))}

          <div className="flex flex-col gap-2">
            <Label>État du bateau</Label>
            <Select value={boat.state} onValueChange={(v) => handleInput("state", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="En construction">En construction</SelectItem>
                <SelectItem value="En service">En service</SelectItem>
                <SelectItem value="En maintenance">En maintenance</SelectItem>
                <SelectItem value="En panne">En panne</SelectItem>
                <SelectItem value="Désarmé">Désarmé</SelectItem>
                <SelectItem value="Hors service">Hors service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Capitaine</Label>
            <Select
              value={boat.crew[0] ?? ""}
              onValueChange={(v) => setBoat(prev => ({ ...prev, crew: [v] }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                {capitaine.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {`${c.name} ${c.lastName}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit"  disabled={isLoading}>
            {isLoading ? (type === "add" ? "Ajout..." : "Modification...") : type === "add" ? "Ajouter" : "Modifier"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BoatModal;
