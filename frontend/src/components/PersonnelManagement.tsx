import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../redux/index";
import InputField from "./tools/InputField";
import { Label } from "./ui/label";
import {
  setUsersInStore,
  addUser,
  updateUser,
  deleteUser,
  setOldUsersAndAllUsers,
} from "../redux/feature/users";
import { addRole, removeRole, updateRole } from "../redux/feature/roles";
import { Menu, Role, User, TABLE_DATA_BASE } from "../data/type";
import { v4 as uuidv4 } from "uuid";
import { Input } from "./ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "./ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Edit, Trash, Plus, Search, Filter, Users } from "lucide-react";
import { onAddService, onUpdateService, onDeleteService, onGetService } from "../data/service";
import { toast } from "react-toastify";
import { HeaderSection } from "./ui/HeaderSection";
import ModalDialog from "./tools/ModalDialog";

const PersonnelManagement = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { allUser: personnels, loading, error } = useSelector(
    (state: RootState) => state.users
  );
  const currentUser = useSelector(
    (state: RootState) => state.users.currentUser
  );

  const rolesState = useSelector((state: RootState) => state.roles);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editPersonnel, setEditPersonnel] = useState<User | null>(null);
  const [formData, setFormData] = useState<User>({
    id: uuidv4(),
    name: "",
    lastName: "",
    password: "",
    email: "",
    tel: "",
    role: "Agent",
    userId: currentUser?.id ?? "",
  });
  const [showModalDialog, setShowModalDialog] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string>('');
  const [menus, setMenus] = useState<Menu[]>([]);

  // Modal pour ajouter un rôle personnalisé
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);

  //Etat pour le modal de modification des permissions
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingMenus, setEditingMenus] = useState<string[]>([]);

  useEffect(() => {
    const loadUsersAndAudit = async () => {
      const users = await onGetService<User>(TABLE_DATA_BASE.USER);
      const oldUsers = await onGetService<User>(TABLE_DATA_BASE.OLDEUSERS);
      dispatch(setOldUsersAndAllUsers(oldUsers));
      dispatch(setUsersInStore(users));
    };
    loadUsersAndAudit();
  }, [dispatch]);

  const filteredPersonnels = personnels.filter((personnel) => {
    const matchesSearch =
      personnel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      personnel.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      personnel.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      filterRole === "all" || personnel.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const statsData = [
    { name: "Total", value: personnels.length, color: "#2563eb" },
    ...rolesState.list.map((role, i) => ({
      name: role.name,
      value: personnels.filter((p) => p.role === role.name).length,
      color: [
        "#3b82f6", "#06b6d4", "#6366f1", "#10b981", "#f59e0b", "#c222f3ff"
      ][i % 6], // couleur cyclée
    })),
    // { name: "Capitaines", value: personnels.filter(p => p.role === "Capitaine").length, color: "#3b82f6" },
    // { name: "Gestionnaires", value: personnels.filter(p => p.role === "Gestionnaire").length, color: "#06b6d4" },
    // { name: "Agents", value: personnels.filter(p => p.role === "Agent").length, color: "#6366f1" },
  ];

  const handleAdd = async (user: User) => {
    const userAdd: User = {
      ...user,
      password: "0000",
      role: user.role || "Agent",
      email: user.email || `${user.name.toLowerCase()}.${user.lastName.toLowerCase()}@example.com`,
      userId: currentUser?.id || "",
    }

    const f = await onAddService(TABLE_DATA_BASE.USER, userAdd);
    if (f === "success") {
      dispatch(addUser(userAdd));
      toast.success("Personnel ajouté avec succès.");
    } else {
      toast.error("Erreur lors de l'ajout du personnel.");
    }
  };
  const handleUpdate = async (user: User) => {
    const userToUpdate = { ...user, userId: currentUser?.id || "" };
    const result = await onUpdateService(TABLE_DATA_BASE.USER, userToUpdate);
    if (result === "success") {
      dispatch(updateUser(userToUpdate));
      toast.success("Personnel modifié avec succès.");
    } else {
      toast.error("Erreur lors de la modification du personnel.");
    }
  };
  const handleDelete = async (user: User) => {
    try {
      // Copier dans OldUsers pour audit
      const userWithAudit: User = { ...user, userId: currentUser?.id || "" };
      const responseDelete = await onAddService(TABLE_DATA_BASE.OLDEUSERS, userWithAudit);
      if (responseDelete === "success") {
        const oldUsers = await onGetService<User>(TABLE_DATA_BASE.OLDEUSERS);
        dispatch(setOldUsersAndAllUsers(oldUsers));
      }

      // Supprimer dans USER
      const result = await onDeleteService(TABLE_DATA_BASE.USER, user.id);
      if (result === "success") {
        dispatch(deleteUser(user.id));
        toast.success("Personnel supprimé avec succès.");
      } else {
        toast.error("Erreur lors de la suppression du personnel.");
      }
    } catch (err) {
      toast.error("Erreur lors de la suppression du personnel.");
      console.error(err);
    }
    setShowModalDialog(false);
    setDeleteId('');
  };


  const canEdit = currentUser && currentUser.role === "Propriétaire";

  const openAddForm = () => {
    setEditPersonnel(null);
    setFormData({
      id: uuidv4(),
      name: "",
      lastName: "",
      password: "",
      email: "",
      tel: "",
      role: "Agent",
      userId: currentUser?.id ?? "",
    });
    setShowForm(true);
  };

  const openEditForm = (personnel: User) => {
    setEditPersonnel(personnel);
    setFormData(personnel);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPersonnel) {
      handleUpdate(formData);
    } else {
      handleAdd({ ...formData, id: uuidv4() });
    }
    setShowForm(false);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setEditingMenus(role.menus);
    setIsEditingRole(true);
  };


  //  Charger les menus au montage
  useEffect(() => {
    onGetService<Menu>("menus").then(setMenus);
  }, []);

  const handleAddRole = async () => {
    if (newRole.trim() === "") return;

    const newRoleObj: Role = {
      id: uuidv4(),
      name: newRole,
      menus: Array.from(new Set([...selectedMenuIds, "profile"])), // "profile" toujours inclus
      userId: currentUser?.id || "",
    };

    const res = await onAddService(TABLE_DATA_BASE.ROLE, newRoleObj);
    if (res === "success") {
      dispatch(addRole(newRoleObj));
      toast.success("Rôle ajouté avec succès !");
      setNewRole("");
      setSelectedMenuIds([]);
      setIsAddingRole(false);
    } else {
      toast.error("Erreur lors de l’ajout du rôle !");
    }
  };

  const handleSaveRoleMenus = async () => {
    if (!editingRole) return;
    const updatedRole = {
      ...editingRole,
      menus: Array.from(new Set([...editingMenus, "profile"])), // "profile" toujours inclus 
      userId: currentUser?.id || "",
    };

    const res = await onUpdateService(TABLE_DATA_BASE.ROLE, updatedRole);
    if (res === "success") {
      dispatch(updateRole(updatedRole));
      toast.success("Menus du rôle mis à jour !");
      setIsEditingRole(false);
    } else {
      toast.error("Erreur lors de la mise à jour !");
    }
  };

  const handleDeleteRole = async (role: Role) => {
    const result = await onDeleteService("roles", role.id);
    if (result === "success") {
      dispatch(removeRole(role));
      toast.success("Rôle supprimé avec succès !");
    } else {
      toast.error("Erreur lors de la suppression du rôle !");
    }
    setShowModalDialog(false);
    setDeleteId('');
  };

  const [modalType, setModalType] = useState<"User" | "Role" | null>(null);

  const onResponse = (id: string) => {
    handleDelete(personnels.find(p => p.id === id)!);
  }

  const deleteRole = (id: string) => {
    handleDeleteRole(rolesState.list.find(r => r.id === id)!);
  }

  const defaultRoles = ["Propriétaire", "Gestionnaire", "Capitaine", "Agent"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <HeaderSection subtitle="Gérez tous les personnels, leurs rôles et accès à la plateforme" title="Gestion des personnels"
        actions={
          <>
            {canEdit && (
              <Button variant="default" onClick={() => setIsAddingRole(true)}>
                <Plus /> Autre rôle
              </Button>
            )}
            {canEdit && (
              <Button variant="default" onClick={openAddForm}>
                <Plus className="h-4 w-4 mr-2" />Ajouter un personnel
              </Button>
            )}
          </>
        }></HeaderSection>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsData.map(stat => (
          <Card key={stat.name} className="border-border hover:shadow-md transition-shadow p-4 text-center">
            <CardHeader>
              <CardTitle style={{ color: stat.color }}>{stat.value}</CardTitle>
              <CardDescription>{stat.name}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Formulaire modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editPersonnel ? "Modifier" : "Ajouter"} un personnel
              </DialogTitle>
            </DialogHeader>

            {/* Champ prénom */}
            <InputField
              label="Prénom"
              value={formData.name}
              onChange={(v) => setFormData({ ...formData, name: v })}
            />

            {/* Champ nom */}
            <InputField
              label="Nom"
              value={formData.lastName}
              onChange={(v) => setFormData({ ...formData, lastName: v })}
            />

            {/* Champ email */}
            <InputField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(v) => setFormData({ ...formData, email: v })}
            />

            {/* Champ téléphone */}
            <InputField
              label="Téléphone"
              value={formData.tel}
              onChange={(v) => setFormData({ ...formData, tel: v })}
            />

            {/* Select rôle */}
            <div className="flex flex-col gap-1">
              <Label>Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value: string) => {
                  if (value === "Autres") {
                    setIsAddingRole(true); // ouvre le champ pour ajouter
                  } else {
                    setFormData({ ...formData, role: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  {rolesState.list.map((r) => (
                    <div key={r.id} className="flex items-center justify-between">
                      <SelectItem value={r.name}>{r.name}</SelectItem>
                      <div className="flex gap-1">
                        {/* Bouton Edit */}
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditRole(r)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Bouton Delete */}
                        {!defaultRoles.includes(r.name) && canEdit && (
                          <Button
                            size="sm"
                            variant="destructive" // style rouge si tu utilises shadcn/ui
                            onClick={() => {
                              setShowForm(false);
                              setDeleteId(r.id);
                              setModalType("Role");
                              setShowModalDialog(true);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <SelectItem value="Autres">
                    <Plus className="h-4 w-4 mr-2" />Autres…
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Boutons */}
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
              </DialogClose>
              <Button type="submit">
                {editPersonnel ? "Enregistrer" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal d’ajout d’un nouveau rôle */}
      <Dialog open={isAddingRole} onOpenChange={setIsAddingRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau rôle</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <InputField
              label="Nom du nouveau rôle"
              value={newRole}
              onChange={(v) => setNewRole(v)}
            />

            <Label>Menus accessibles</Label>
            <div className="grid grid-cols-2 gap-2">
              {menus.map((menu) => (
                <label key={menu.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={
                      menu.id === "profile"
                        ? true
                        : selectedMenuIds.includes(menu.id)
                    }
                    disabled={
                      menu.id === "profile" ||
                      menu.id === "dashboard" // dashboard non modifiable ici
                    }
                    onChange={() => {
                      if (menu.id === "profile" || menu.id === "dashboard") return;
                      setSelectedMenuIds((prev) =>
                        prev.includes(menu.id)
                          ? prev.filter((id) => id !== menu.id)
                          : [...prev, menu.id]
                      );
                    }}
                  />
                  <span
                    className={
                      menu.id === "profile" || menu.id === "dashboard"
                        ? "text-gray-500"
                        : ""
                    }
                  >
                    {menu.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Annuler</Button>
            </DialogClose>
            <Button onClick={handleAddRole}>Valider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de modification des permissions d’un rôle */}
      <Dialog open={isEditingRole} onOpenChange={setIsEditingRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les accès du rôle {editingRole?.name}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {menus.map((menu) => (
              <label key={menu.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    menu.id === "profile"
                      ? true
                      : editingMenus.includes(menu.id)
                  }
                  disabled={
                    menu.id === "profile" ||
                    menu.id === "dashboard" // dashboard non modifiable ici
                  }
                  onChange={() => {
                    if (menu.id === "profile" || menu.id === "dashboard") return;
                    setEditingMenus((prev) =>
                      prev.includes(menu.id)
                        ? prev.filter((id) => id !== menu.id)
                        : [...prev, menu.id]
                    );
                  }}
                />
                <span
                  className={
                    menu.id === "profile" || menu.id === "dashboard"
                      ? "text-gray-500"
                      : ""
                  }
                >
                  {menu.label}
                </span>
              </label>
            ))}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Annuler</Button>
            </DialogClose>
            <Button onClick={handleSaveRoleMenus}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onglets */}
      <div className="tabs space-y-4">
        <div className="tab-content space-y-4">
          <Card className="border-border hover:shadow-md transition-shadow mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Champ recherche */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                {/* Filtre rôle */}
                <div className="w-full md:w-48 relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Tous les rôles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les rôles</SelectItem>
                      {rolesState.list.map((r) => (
                        <SelectItem key={r.id} value={r.name}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading && <div>Chargement...</div>}
          {error && <div className="text-red-500">{error}</div>}
          <Card className="border-border hover:shadow-md transition-shadow mt-4">
            <CardHeader>
              <CardTitle className="flex items-center text-[#001F3F]">
                <Users className="h-5 w-5 mr-2" />
                Liste des personnels ({filteredPersonnels.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 py-2">Nom</TableHead>
                      <TableHead className="px-4 py-2">Email</TableHead>
                      <TableHead className="px-4 py-2">Téléphone</TableHead>
                      <TableHead className="px-4 py-2">Rôle</TableHead>
                      {canEdit && <TableHead className="px-4 py-2 text-center">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPersonnels.map(personnel => (
                      <TableRow key={personnel.id} className="hover:bg-gray-50">
                        <TableCell className="px-4 py-2">{personnel.name} {personnel.lastName}</TableCell>
                        <TableCell className="px-4 py-2">{personnel.email}</TableCell>
                        <TableCell className="px-4 py-2">{personnel.tel}</TableCell>
                        <TableCell className="px-4 py-2">{personnel.role}</TableCell>
                        {canEdit && (
                          <TableCell className="px-4 py-2 text-center flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditForm(personnel)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setDeleteId(personnel.id);
                                setModalType("User");
                                setShowModalDialog(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {showModalDialog && modalType && (
        <ModalDialog
          action="delete"
          onClose={() => {
            setShowModalDialog(false);
            setModalType(null);
          }}
          title="Suppression"
          type={modalType}
          id={deleteId}
          onResponse={modalType === "User" ? onResponse : deleteRole}
        />
      )}
    </div>
  );
};

export default PersonnelManagement;