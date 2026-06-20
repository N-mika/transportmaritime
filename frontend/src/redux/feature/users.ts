import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../data/type";
import { v4 as uuid } from "uuid";

// Utilitaires localStorage
function loadFromLocalStorage<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Erreur de parsing localStorage clé="${key}"`, error);
    return fallback;
  }
}

const initialState: {
  allUser: User[];
  loading: boolean;
  error: string | null;
  success: string | null;
  currentUser: User | null;
  oldUsersAndAllUsers: User[]; // pour garder les utilisateurs supprimés
} = {
  currentUser: loadFromLocalStorage<User | null>("currentUser", null),
  allUser: loadFromLocalStorage<User[]>("users", []),
  oldUsersAndAllUsers: [],
  loading: false,
  error: null,
  success: null,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setUsersInStore(state, action: PayloadAction<User[]>) {
      state.allUser = action.payload;
    },
    addUser(state, action: PayloadAction<Omit<User, "id" | "password">>) {
      state.allUser.push({
        ...action.payload,
        id: uuid(),
        password: "0000",
      });
      state.success = "Utilisateur ajouté.";
      state.error = null;
    },
    updateUser(state, action: PayloadAction<User>) {
      const idx = state.allUser.findIndex((u) => u.id === action.payload.id);
      if (idx !== -1) {
        // garder l’ancien mot de passe
        const oldPassword = state.allUser[idx].password;
        state.allUser[idx] = {
          ...action.payload,
          password: oldPassword,
        };
        state.success = "Utilisateur modifié.";
        state.error = null;
      }
    },
    deleteUser(state, action: PayloadAction<string>) {
      state.allUser = state.allUser.filter((u) => u.id !== action.payload);
      state.success = "Utilisateur supprimé.";
      state.error = null;
    },
    updateUserPassword(
      state,
      action: PayloadAction<{ userId: string; newPassword: string }>
    ) {
      const user = state.allUser.find((u) => u.id === action.payload.userId);
      if (user) {
        user.password = action.payload.newPassword;
        state.success = "Mot de passe changé avec succès.";
        state.error = null;
      }
    },
    setCurrentUser(state, action: PayloadAction<User | null>) {
      state.currentUser = action.payload;
      if (action.payload) {
        localStorage.setItem("currentUser", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("currentUser");
      }
    },
    setOldUsersAndAllUsers(state, action: PayloadAction<User[]>) {
      state.oldUsersAndAllUsers = [...action.payload, ...state.allUser];
    },
    logout(state) {
      state.currentUser = null;
      localStorage.removeItem("currentUser");
    },
    clearMessages(state) {
      state.error = null;
      state.success = null;
    },
  },
});

export const {
  setLoading,
  setUsersInStore,
  addUser,
  updateUser,
  deleteUser,
  updateUserPassword,
  setCurrentUser,
  logout,
  clearMessages,
  setOldUsersAndAllUsers,
} = usersSlice.actions;

export default usersSlice.reducer;
