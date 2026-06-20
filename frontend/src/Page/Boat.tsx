import { FC, useState } from "react";
import { Button } from "../components/ui/button";
import { Hammer, Plus, Ship } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useSelector } from "react-redux";
import { RootState } from "../redux";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Boat, TABLE_DATA_BASE } from "../data/type";
import { HeaderSection } from "../components/ui/HeaderSection";
import { boatVoid } from "../data/dataVoid";
import BoatModal from "../components/BoatModal";
import { setBoatsInStore } from "../redux/feature/stJude";
import Loader from "../components/tools/Loader";
import { useFetchCollection } from "../hooks/useFetchCollection";

const BoatComponant: FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentBoat, setCurrentBoat] = useState<Boat>(boatVoid);
  const [type, setType] = useState<"add" | "edit">("add");

  const { boat: boats, loadingOne } = useSelector((state: RootState) => state.stJude);
  const capitaines = useSelector((state: RootState) => state.users.allUser);


  const capitaine = capitaines.filter(({ role }) => role === "Capitaine")
  const boatS = boats.filter(({ state }) => state === "En service");
  const boatC = boats.filter(({ state }) => state === "En construction");

  useFetchCollection<Boat>(TABLE_DATA_BASE.BOAT, setBoatsInStore);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <HeaderSection
        title="Gestion des Bateaux"
        subtitle="Construction des nouveaux Bateaux, Tonage et volume"
        actions={
          <>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => { setShowModal(true); setType("add"); setCurrentBoat(boatVoid) }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un bateau
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Ship className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tous les bateaux</p>
                <p className="text-2xl font-bold">{boats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Ship className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En service</p>
                <p className="text-2xl font-bold">{boatS.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Hammer className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En construction</p>
                <p className="text-2xl font-bold">{boatC.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ship className="h-5 w-5 mr-2" />
            Liste des bateaux ( {boats.length} )
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto relative">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Capacité (T)</TableHead>
                  <TableHead>Etat</TableHead>
                  <TableHead>Capitaine</TableHead>
                </TableRow>
              </TableHeader>
              { !loadingOne &&
                <TableBody>
                  {boats.map((boat) => {
                    const currentCapitaine = capitaine.find(({ id }) => boat.crew.includes(id));
                    return (
                      <TableRow key={boat.id} className="hover:bg-gray-50" onClick={() => { setCurrentBoat(boat); setShowModal(true); setType("edit") }}>
                        <TableCell className="font-medium text-[#001F3F]">{boat.id}</TableCell>
                        <TableCell className="font-medium">{boat.name}</TableCell>
                        <TableCell className="font-medium">{boat.capacity}</TableCell>
                        <TableCell className="font-medium">{boat.state}</TableCell>
                        <TableCell className="font-medium"> {currentCapitaine ? `${currentCapitaine.name} ${currentCapitaine.lastName}` : "-"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              }
            </Table>
            {
              loadingOne ? <div className="flex flex-col items-center justify-center">
                <Loader />
              </div> : boats.length === 0 && (
                <div className="flex flex-col items-center justify-center">
                  <Ship></Ship>
                  <p>Aucun bateau</p>
                </div>
              )
            }
          </div>
        </CardContent>
      </Card>
      {showModal && <BoatModal currentBoatSelected={currentBoat} onClose={() => setShowModal(false)} type={type}></BoatModal>}
    </div>
  )
}
export default BoatComponant;