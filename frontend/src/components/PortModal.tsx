// components/PortModal.tsx
import { FC, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useSelector } from "react-redux";
import { RootState } from "../redux";
import { onAddService, onGetService, onUpdateService, onDeleteService } from "../data/service";
import { toast } from "react-toastify";
import HeadModale from "./tools/HeadModale";
import { v4 as uuid } from "uuid";
import { Port, TABLE_DATA_BASE } from "../data/type";
import { Edit, Plus, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import ModalDialog from "./tools/ModalDialog";

interface PortModalProps {
    onClose: () => void;
}

const PortModal: FC<PortModalProps> = ({ onClose }) => {
    const [port, setPort] = useState<Port[]>([]);
    const [newPortName, setNewPortName] = useState<string>("");
    const [editingPort, setEditingPort] = useState<Port | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const currentUser = useSelector((state: RootState) => state.users.currentUser);
    const defaultPorts = ["Antalaha", "Tamatave"];
    const [showModalDialog, setShowModalDialog] = useState<boolean>(false);
    const [idSelected, setIdSelected] = useState<string>('');


    useEffect(() => {
    const fetchPorts = async () => {
      try {
        const response = await onGetService(TABLE_DATA_BASE.PORT) as Port[];
        setPort(response || []);
      }
      catch (error) {
        toast.error("Erreur lors de la récupération des ports");
      }
    };

    fetchPorts();
  }, []);

    const handleAddPort = async () => {
        if (!newPortName.trim()) {
            toast.error("Le nom du port ne peut pas être vide");
            return;
        }

        if (port.some(p => p.name.toLowerCase() === newPortName.trim().toLowerCase())) {
            toast.error("Ce port existe déjà");
            return;
        }

        setIsLoading(true);
        try {
            const newPort: Port = {
                id: uuid(),
                name: newPortName.trim(),
                userId: currentUser ? currentUser.id : "",
            };

            const response = await onAddService(TABLE_DATA_BASE.PORT, newPort);
            if (response === "success") {
                setPort(prev => [...prev, newPort]);
                setNewPortName("");
                toast.success("Port ajouté avec succès !");
            } else {
                toast.error("Erreur lors de l'ajout du port");
            }
        } catch (error) {
            toast.error("Erreur lors de l'ajout du port");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditPort = async () => {
        if (!editingPort || !newPortName.trim()) {
            toast.error("Le nom du port ne peut pas être vide");
            return;
        }

        if (port.some(p => p.name.toLowerCase() === newPortName.trim().toLowerCase() && p.id !== editingPort.id)) {
            toast.error("Ce port existe déjà");
            return;
        }

        setIsLoading(true);
        try {
            const updatedPort: Port = {
                ...editingPort,
                name: newPortName.trim(),
            };

            const response = await onUpdateService(TABLE_DATA_BASE.PORT, updatedPort);
            if (response === "success") {
                setPort(prev => prev.map(p => p.id === editingPort.id ? updatedPort : p));
                setNewPortName("");
                setEditingPort(null);
                toast.success("Port modifié avec succès !");
            } else {
                toast.error("Erreur lors de la modification du port");
            }
        } catch (error) {
            toast.error("Erreur lors de la modification du port");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeletePort = async (port: Port) => {
        if (defaultPorts.includes(port.name)) {
            toast.error("Impossible de supprimer un port par défaut");
            return;
        }

        // Vérifier si le port est utilisé dans des trajets
        try {
            const trips = await onGetService(TABLE_DATA_BASE.TRIP);
            const isPortUsed = trips.some((trip: any) =>
                trip.from === port.name || trip.to === port.name
            );

            if (isPortUsed) {
                toast.error("Impossible de supprimer ce port car il est utilisé dans des trajets");
                return;
            }

            const response = await onDeleteService(TABLE_DATA_BASE.PORT, port.id);
            if (response === "success") {
                setPort(prev => prev.filter(p => p.id !== port.id));
                toast.success("Port supprimé avec succès !");
            } else {
                toast.error("Erreur lors de la suppression du port");
            }
        } catch (error) {
            toast.error("Erreur lors de la suppression du port");
        }
    };

    const startEditing = (port: Port) => {
        setEditingPort(port);
        setNewPortName(port.name);
    };

    const cancelEditing = () => {
        setEditingPort(null);
        setNewPortName("");
    };

    const onResponse = (id: string) => {
        if (id) {
            handleDeletePort(port.find(p => p.id === id)!);
        }
        setShowModalDialog(false);
        setIdSelected('');
    };

    return (
        <div className="flex items-center justify-center inset-0 fixed z-50">
            <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
            <div className="relative z-50 bg-white rounded-lg shadow-lg w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto">
                <HeadModale tittle="Gestion des Ports" />

                <div className="p-6">
                    {/* Formulaire d'ajout/modification */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>
                                {editingPort ? "Modifier le port" : "Ajouter un nouveau port"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label htmlFor="port-name" className="sr-only">
                                        Nom du port
                                    </Label>
                                    <Input
                                        id="port-name"
                                        value={newPortName}
                                        onChange={(e) => setNewPortName(e.target.value)}
                                        placeholder="Nom du port"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                editingPort ? handleEditPort() : handleAddPort();
                                            }
                                        }}
                                    />
                                </div>
                                {editingPort ? (
                                    <>
                                        <Button
                                            onClick={handleEditPort}
                                            disabled={isLoading || !newPortName.trim()}
                                        >
                                            {isLoading ? "Modification..." : "Modifier"}
                                        </Button>
                                        <Button variant="outline" onClick={cancelEditing}>
                                            Annuler
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={handleAddPort}
                                        disabled={isLoading || !newPortName.trim()}
                                    >
                                        {isLoading ? "Ajout..." : <Plus className="h-4 w-4 mr-2" />}
                                        Ajouter
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Liste des ports */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ports existants ({port.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-96 overflow-y-auto">
                            <div className="space-y-3">
                                {port.map((port) => (
                                    <div
                                        key={port.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium">{port.name}</span>
                                            {defaultPorts.includes(port.name) && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Défaut
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => startEditing(port)}
                                                disabled={isLoading}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            {!defaultPorts.includes(port.name) && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => { setIdSelected(port.id); setShowModalDialog(true); }}
                                                    disabled={isLoading}
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {port.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        Aucun port trouvé. Ajoutez votre premier port.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            {showModalDialog && (<ModalDialog
                action="delete"
                onClose={() => setShowModalDialog(false)}
                title="Suppression"
                type="Port"
                id={idSelected}
                onResponse={onResponse}
            />
            )}
        </div>
    );
};

export default PortModal;