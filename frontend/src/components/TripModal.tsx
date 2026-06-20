import { FC, useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useDispatch, useSelector } from "react-redux";
import { setTrip } from "../redux/feature/stJude";
import { TABLE_DATA_BASE, Trip } from "../data/type";
import { RootState } from "../redux";
import { onAddService, onUpdateService, onGetService } from "../data/service";
import { toast } from "react-toastify";
import HeadModale from "./tools/HeadModale";
import { v4 as uuid } from "uuid";
import { FieldDefinition, validateForm } from "../Tools/Tools";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import DateTimeWheelSelector from "./DateTimeSelector";


const inputFields: FieldDefinition<Trip>[] = [
  { key: "depart", label: "Date départ", type: "datetime-local", required: true },
  { key: "arrive", label: "Date arrivée", type: "datetime-local", required: false },
  { key: "loadingStartDate", label: "Date début de chargement", type: "datetime-local", required: false },
  { key: "boatId", label: "Bateau", type: "select", required: true },
  { key: "from", label: "De", type: "select", required: true },
  { key: "to", label: "Vers", type: "select", required: true },
  { key: "status", label: "Statut", type: "select", required: true },
];

interface TripModalUpdateProps {
  onClose: () => void;
  currentTrip: Trip;
  type: "add" | "edit";
}

const TripModalUpdate: FC<TripModalUpdateProps> = ({
  onClose,
  currentTrip,
  type,
}) => {
  const boat = useSelector((state: RootState) => state.stJude.boat);
  const [tripState, setTripState] = useState<Trip>(currentTrip);
  const [port, setPort] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = useSelector((state: RootState) => state.users.currentUser);
  const dispatch = useDispatch();
  const [searchPort, setSearchPort] = useState("");

  const filteredPorts = useMemo(() => {
    if (!searchPort) return port;
    return port.filter(p =>
      p.toLowerCase().includes(searchPort.toLowerCase())
    );
  }, [port, searchPort]);

  useEffect(() => {
    const fetchPorts = async () => {
      try {
        const response = await onGetService(TABLE_DATA_BASE.PORT);
        const portNames = response.map((p: any) => p.name);
        setPort(portNames);
      }
      catch (error) {
        toast.error("Erreur lors de la récupération des ports");
      }
    };

    fetchPorts();
  }, []);

  useEffect(() => {
    setTripState((prev) => ({
      ...prev,
      ...currentTrip,
      boatId: boat.length === 1 ? boat[0].id : currentTrip.boatId || "",
      from: currentTrip.from || "",
      to: currentTrip.to || "",
      status: currentTrip.status || "Prévu",
    }));
  }, [currentTrip, boat]);

  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleInput = (field: keyof Trip, value: string) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
    if (field !== "arrive" && field !== "depart")
      setTripState((prev) => ({
        ...prev,
        arrive: formatDateForInput(tripState.arrive),
        depart: formatDateForInput(tripState.depart),
        loadingStartDate: formatDateForInput(tripState.loadingStartDate),
        [field]: value,
      }));
    else setTripState((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmitData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const validationErrors = validateForm(tripState, inputFields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    setIsLoading(true);
    try {
      if (type === "add") {
        const trip: Trip = {
          id: uuid(),
          arrive: tripState.arrive,
          boatId: boat.length === 1 ? boat[0].id : tripState.boatId,
          depart: tripState.depart,
          loadingStartDate: tripState.loadingStartDate,
          from: tripState.from,
          status: "Prévu",
          to: tripState.to,
          userId: currentUser ? currentUser.id : "",
        };

        const response = await onAddService(TABLE_DATA_BASE.TRIP, trip);
        if (response === "success") {
          dispatch(setTrip(trip));
          toast.success("Trajet ajouté avec succès !");
          onClose();
        } else {
          toast.error("Erreur lors de l'ajout du trajet.");
        }
      }


      if (type === "edit") {
        const trip: Trip = {
          id: currentTrip.id,
          arrive: tripState.arrive,
          boatId: boat.length === 1 ? boat[0].id : tripState.boatId,
          depart: tripState.depart,
          loadingStartDate: tripState.loadingStartDate,
          from: tripState.from,
          status: tripState.status,
          to: tripState.to,
          userId: currentUser ? currentUser.id : "",
        };

        const hasChanges = Object.keys(trip).some(
          (key) => (trip as any)[key] !== (currentTrip as any)[key]
        );
        if (!hasChanges) {
          toast.info("Aucune modification apportée au trajet.");
          onClose();
          return;
        }

        const response = await onUpdateService(TABLE_DATA_BASE.TRIP, trip);
        if (response === "success") {
          dispatch(setTrip(trip));
          toast.success("Voyage modifié avec succès !");
          onClose();
        } else {
          toast.error("Erreur lors de la modification du trajet.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center inset-0 fixed z-50">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="relative z-50 bg-white rounded-lg shadow-lg w-[50%]">
        <HeadModale
          tittle={type === "add" ? "Ajouter un trajet" : "Modifier un trajet"}
        />
        <form className="flex p-6 flex-col gap-4" onSubmit={onSubmitData}>
          {boat.length !== 1 && (
            <div className="flex flex-col gap-2">
              <Label className="text-card-foreground">Bateau</Label>
              <Select
                value={tripState.boatId || ""}
                onValueChange={(v) => handleInput("boatId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="..." />
                </SelectTrigger>
                <SelectContent>
                  {boat.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.boatId && (
                <p className="text-red-500 text-sm">{errors.boatId}</p>
              )}
            </div>
          )}

          {inputFields
            .filter((f) => f.type === "datetime-local")
            .map(({ key, label}) => {
              const rawValue = tripState[key as keyof Trip] || "";
              const value = formatDateForInput(rawValue);
              return (
                <DateTimeWheelSelector
                  key={key}
                  label={label}
                  value={value}
                  onChange={(val) => handleInput(key as keyof Trip, val)}
                  error={errors[key]}
                />
              );
            })}

          {/* --- Sélection du port de départ --- */}
          <div className="flex flex-col gap-2">
            <Label className="text-card-foreground">De</Label>
            <Select
              value={tripState.from || ""}
              onValueChange={(v) => handleInput("from", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {/* Champ de recherche */}
                <div className="sticky top-0 bg-popover p-2 border-b z-10">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un port..."
                      value={searchPort}
                      onChange={(e) => setSearchPort(e.target.value)}
                      className="pl-8 h-9 text-sm"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                {filteredPorts.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
                {searchPort && filteredPorts.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Aucun port trouvé
                  </div>
                )}
              </SelectContent>
            </Select>
            {errors.from && <p className="text-red-500 text-sm">{errors.from}</p>}
          </div>

          {/* --- Sélection du port d’arrivée --- */}
          <div className="flex flex-col gap-2">
            <Label className="text-card-foreground">Vers</Label>
            <Select
              value={tripState.to || ""}
              onValueChange={(v) => handleInput("to", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {/* Champ de recherche */}
                <div className="sticky top-0 bg-popover p-2 border-b z-10">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un port..."
                      value={searchPort}
                      onChange={(e) => setSearchPort(e.target.value)}
                      className="pl-8 h-9 text-sm"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                {filteredPorts.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
                {searchPort && filteredPorts.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Aucun port trouvé
                  </div>
                )}
              </SelectContent>
            </Select>
            {errors.to && <p className="text-red-500 text-sm">{errors.to}</p>}
          </div>

          {/* --- Statut du trajet --- */}
          <div className="flex flex-col gap-2">
            <Label className="text-card-foreground">Statut</Label>
            <Select
              value={tripState.status || ""}
              onValueChange={(v) => handleInput("status", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Prévu">Programmé</SelectItem>
                <SelectItem value="Encours">En cours</SelectItem>
                <SelectItem value="Arriver">Terminé</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-red-500 text-sm">{errors.status}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Chargement..." : type === "add" ? "Ajouter" : "Modifier"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default TripModalUpdate;
