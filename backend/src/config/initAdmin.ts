import User from "../model/User";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export const initializeAdmin = async () => {
  try {
    const adminEmail = "admin@transmaritime.com";
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("0000", 10);
      await User.create({
        id: uuidv4(),
        name: "Admin",
        lastName: "transmaritime",
        password: hashedPassword,
        email: adminEmail,
        tel: "0370000000",
        role: "Propriétaire",
        userId: "system-user",
      });
    }
    console.log("Utilisateur admin initialisé en base");
  } catch (err) {
    console.error(
      "Erreur lors de l'initialisation de l'utilisateur admin:",
      err,
    );
  }
};
