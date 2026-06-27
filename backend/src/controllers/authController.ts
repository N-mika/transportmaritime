import { Request, Response } from "express";
import User from "../model/User";
import bcrypt from "bcryptjs";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Identifiants invalides" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Mot de passe incorrect" });

    res.json({
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      tel: user.tel,
      role: user.role,
      // tu peux ajouter un JWT ici si tu veux sécuriser la session
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
