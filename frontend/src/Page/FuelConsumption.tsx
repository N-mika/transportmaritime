import { FC, useState } from "react";
import { Button } from "../components/ui/button";
import { Calculator, Filter, Fuel, Plus, Search } from "lucide-react";
import CashFuelConsumption from "../components/FuelConsumptionForm";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useSelector } from "react-redux";
import { RootState } from "../redux";
import { formatDate } from "../Tools/Tools";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { HeaderSection } from "../components/ui/HeaderSection";
import { useFetchCollection } from "../hooks/useFetchCollection";
import { TABLE_DATA_BASE, FuelConsumption as TypeFuelConsumption } from "../data/type";
import { setFuelConsumptionsInStore } from "../redux/feature/stJude";
import Loader from "../components/tools/Loader";
import useFinders from "../Tools/finders";

const FuelConsumption: FC = () => {
  const [showFuel, setShowFuel] = useState<boolean>(false);
  const [filterFuelConsumption, setfilterFuelConsumption] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [specificDate, setSpecificDate] = useState<string>("");
  const { findBoat, findTrip, findUser } = useFinders()
  const { fuelConsumption, loadingOne } = useSelector((state: RootState) => state.stJude);
  const { currentUser } = useSelector((state: RootState) => state.users);

  useFetchCollection<TypeFuelConsumption>(TABLE_DATA_BASE.FUELCONSUMPTION, setFuelConsumptionsInStore);

  const fuelConsumptionFilter = fuelConsumption.filter((f) => {
    const search = searchTerm.toLowerCase();
    const user = findUser(f.userId);
    const trip = findTrip(f.tripId);
    const boat = findBoat(trip.boatId);

    // Restriction par rôle
    if (currentUser)
      if (currentUser.role === "Capitaine") {
        if (!boat.crew.includes(currentUser.id)) return false;
      }

    // 1. Filtrage par trajet (depuis le Select)
    if (filterFuelConsumption !== "all") {
      const trajet = `${trip.from} → ${trip.to}`.toLowerCase();
      if (!trajet.includes(filterFuelConsumption.toLowerCase())) {
        return false;
      }
    }

    // --- Filtre par date spécifique ---
    if (specificDate) {
      const filterDate = new Date(specificDate);

      const itemDate = f.createdAt ? new Date(f.createdAt) : null;
      if (!itemDate) return false;

      if (
        itemDate.getDate() !== filterDate.getDate() ||
        itemDate.getMonth() !== filterDate.getMonth() ||
        itemDate.getFullYear() !== filterDate.getFullYear()
      ) {
        return false;
      }
    }

    // 2. Recherche (utilisateur, trajet, bateau, prix, type carburant)
    return (
      user.name.toLowerCase().includes(search) ||
      user.lastName.toLowerCase().includes(search) ||
      `${trip.from} → ${trip.to}`.toLowerCase().includes(search) ||
      boat.name.toLowerCase().includes(search) ||
      f.fuelType.toLowerCase().includes(search) ||
      f.fuelPrice.toString().includes(search) ||
      f.cost.toString().includes(search)
    );
  });


  return (
    <div className="flex flex-col">
      {/* Header */}
      <HeaderSection
        subtitle="Suivi les consomation de carburant"
        title="Gestion de Consomation de carburant"
        actions={currentUser && (currentUser.role === "Capitaine" || currentUser.role === "Propriétaire") &&
          <div className="flex gap-2">
            <Button onClick={() => setShowFuel(true)}>
              <Plus className="h-7 w-7" />Gesttion de Garburant
            </Button>
          </div>} />
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 text-gray-600">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par trajet , utilisateur"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1 text-gray-600">Date spécifique</label>
              <Input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} className="w-full" />
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1 text-gray-600">Trajet</label>
              <Select value={filterFuelConsumption} onValueChange={setfilterFuelConsumption}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer par trajet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les trajets</SelectItem>
                  {Array.from(
                    new Set(
                      fuelConsumption.map((f) => {
                        const trip = findTrip(f.tripId);
                        return `${trip.from} → ${trip.to}`;
                      })
                    )
                  ).map((trajet) => (
                    <SelectItem key={trajet} value={trajet}>
                      {trajet}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Fuel className="h-7 w-7" />
            Consomation ({fuelConsumptionFilter.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilsateur</TableHead>
                  <TableHead className="text-center">Prix Du carburant</TableHead>
                  <TableHead className='text-center'>Prix total</TableHead>
                  <TableHead className='text-center'>Date</TableHead>
                  <TableHead className='text-center'>Voyage</TableHead>
                </TableRow>
              </TableHeader>
              {
                !loadingOne && <TableBody>
                  {fuelConsumptionFilter.map((f) => {
                    const user = findUser(f.userId);
                    const trip = findTrip(f.tripId);
                    const boat = findBoat(trip.boatId);
                    return (
                      <TableRow key={f.id} className="hover:bg-gray-50">
                        <TableCell >{`${user.name} ${user.lastName}`}</TableCell>
                        <TableCell className="text-center">{f.fuelPrice}</TableCell>
                        <TableCell className="text-center">{f.cost}</TableCell>
                        <TableCell className="text-center">{formatDate(f.createdAt as string)}</TableCell>
                        <TableCell className='text-center'>
                          {`${trip.from} → ${trip.to} ( ${formatDate(trip.depart)} avec ${boat.name} ) `}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              }

            </Table>
          </div>
          {loadingOne ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader />
            </div>
          ) : fuelConsumptionFilter.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Calculator className="h-12 w-12" />
              <p>Aucune transaction trouvée</p>
            </div>
          )}

        </CardContent>
      </Card>
      {showFuel && <CashFuelConsumption onClose={() => setShowFuel(false)}></CashFuelConsumption>}
    </div>
  )
}
export default FuelConsumption;