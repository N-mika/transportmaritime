import axios from "axios";
import { Boat, User, Goods, Reservation, Trip, CashMovement, FuelConsumption, Role, CargoType, Notification, Port } from "./type";

const API = "https://backendexpress-pdyd.onrender.com";
// const API = "http://localhost:3000/api";

// CREATE
export const onAddService = async (
  nameAdd: string,
  params: Boat | User | Goods | Reservation | Trip | CashMovement | FuelConsumption | Role | CargoType | Notification | Port
): Promise<"success" | "error"> => {
  try {
    const response = await axios.post(`${API}/${nameAdd.toLowerCase()}`, params);
    return response.status >= 200 && response.status < 300 ? "success" : "error";
  } catch (error) {
    console.error(error);
    return "error";
  }
};

// UPDATE
export const onUpdateService = async (
  nameUpdate: string,
  params: Boat | User | Goods | Reservation | Trip | CashMovement | FuelConsumption | Role | CargoType | Notification | Port
): Promise<"success" | "error"> => {
  try {
    const response = await axios.put(`${API}/${nameUpdate.toLowerCase()}/${params.id}`, params);
    return response.status >= 200 && response.status < 300 ? "success" : "error";
  } catch (error) {
    console.log(error);
    return "error";
  }
};

// GET (all)
export const onGetService = async <T>(endPoint: string): Promise<T[]> => {
  try {
    const response = await axios.get<T[]>(`${API}/${endPoint}`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la requête GET", error);
    return [];
  }
};
// GET (one by id)
export const onGetByIdService = async <T>(endPoint: string, id: string): Promise<T | null> => {
  try {
    const response = await axios.get<T>(`${API}/${endPoint.toLowerCase()}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la requête GET by ID", error);
    return null;
  }
};

// DELETE
export const onDeleteService = async (nameDelete: string, id: string): Promise<"success" | "error"> => {
  try {
    const response = await axios.delete(`${API}/${nameDelete.toLowerCase()}/${id}`);
    return response.status >= 200 && response.status < 300 ? "success" : "error";
  } catch (error) {
    console.error(error);
    return "error";
  }
};

// LOGIN
export const loginService = async (email: string, password: string): Promise<User> => {
  try {
    const response = await axios.post<User>(`${API}/login`, { email, password });
    return response.data;
  } catch (error: any) {
    console.error("Erreur lors de la connexion", error);
    throw new Error(error.response?.data?.message || "Erreur de connexion");
  }
};

