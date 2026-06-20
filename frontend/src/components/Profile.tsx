// src/components/Profile.tsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../redux";
import { updateUserPassword } from "../redux/feature/users";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import InputField from "./tools/InputField";
import { User } from "lucide-react";
import { toast } from "react-toastify";
import { onUpdateService } from "../data/service";
import { HeaderSection } from "./ui/HeaderSection";


const Profile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.users.currentUser);
  const { error, success } = useSelector((state: RootState) => state.users);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async () => {
    if (!currentUser) return;
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast("Veuillez remplir tous les champs.");
      return;
    }
    // Vérifie que l'ancien mot de passe est bien saisi
    if (!oldPassword.trim()) {
      toast("Veuillez entrer votre ancien mot de passe.");
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      toast("Le nouveau mot de passe et la confirmation ne correspondent pas.");
      return;
    }
    if (newPassword.trim() === currentUser.password) {
      toast("Le nouveau mot de passe doit être différent de l'ancien.");
      return;
    }

    const updatedUser = {
      ...currentUser,
      oldPassword: oldPassword.trim(),
      newPassword: newPassword.trim(),
    };
    const result = await onUpdateService("users", updatedUser);

    if (result === "success") {
      dispatch(
        updateUserPassword({
          userId: currentUser.id,
          newPassword: newPassword.trim(),
        })
      );
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Mot de passe modifié avec succès.");
    } else {
      toast("Échec de la modification du mot de passe.");
    }
  };

  if (!currentUser) {
    return <p>Veuillez vous connecter.</p>;
  }

  return (
    <div className="space-y-6">
      <HeaderSection subtitle="Modifiez votre mot de passe pour protéger l’accès à votre compte" title="Mon profil" />
      <div className="p-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="h-5 w-5 mr-2" />
              Mon Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><strong>Nom :</strong> {currentUser.name} {currentUser.lastName}</p>
            <p><strong>Email :</strong> {currentUser.email}</p>
            <p><strong>Rôle :</strong> {currentUser.role}</p>

            <div className="mt-6 space-y-4">
              <p><strong>Changer mon mot de passe</strong></p>
              <div className="flex flex-col gap-4">
                <InputField
                  label="Ancien mot de passe"
                  type="password"
                  value={oldPassword}
                  onChange={setOldPassword}
                />
                <InputField
                  label="Nouveau mot de passe"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                />
                <InputField
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  error={
                    confirmPassword && confirmPassword !== newPassword
                      ? "Les mots de passe ne correspondent pas"
                      : undefined
                  }
                />
                <Button
                  onClick={handleChangePassword}
                  disabled={newPassword.trim().length < 4 || newPassword !== confirmPassword}
                >
                  Modifier
                </Button>

                <p className="text-xs text-muted-foreground">
                  Le mot de passe doit contenir au moins 4 caractères.
                </p>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">{success}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
