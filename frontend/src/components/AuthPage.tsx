import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Label } from './ui/label';
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { AppDispatch } from "../redux";
import { setCurrentUser } from "../redux/feature/users";
import { User as UserIcon, Lock, Ship, Eye, EyeOff } from "lucide-react";
import { loginService, onGetService } from "../data/service";
import { Role, User } from "../data/type";
import Loader from "./tools/Loader";

const AuthPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Appel au backend pour authentification sécurisée
      const user: User = await loginService(login, password);

      if (user) {
        // Récupère les rôles pour associer roleId
        const allRoles = await onGetService<Role>("roles");
        const userRole = allRoles.find(r => r.name === user.role);

        const currentUserWithRole = {
          ...user,
          roleId: userRole?.id,
        };

        // Stocke l'utilisateur dans Redux
        dispatch(setCurrentUser(currentUserWithRole));

        setError("");
        
        if (user.role === "Propriétaire") {
          window.location.hash = "dashboard";
        } else {
        window.location.hash = "profile";
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur serveur, veuillez réessayer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md p-6 shadow-lg border-1 border-primary bg-white/20 backdrop-blur-md">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl z-10">
            <Loader text="Connexion en cours..." />
          </div>
        )}
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Ship className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl text-black mb-2">Bienvenue sur Saint Jude</CardTitle>
            <p className="text-sm text-slate-600 mt-1">Gestion du transport maritime de marchandises</p>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">Adresse email</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Email ou nom d'utilisateur"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#001F3F] focus:ring-[#001F3F]"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#001F3F] focus:ring-[#001F3F]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
        <div className="text-center text-xs text-gray-500">
          Saint Jude - Transport Maritime Antalaha ↔ Toamasina
        </div>
      </Card>
    </div>
  );
};

export default AuthPage;