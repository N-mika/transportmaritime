import { Document } from "mongoose";
// ENUMS
export type Etat = "Encours" | "Arriver" | "Depart";
export type EtatBoat =
  | "En construction"
  | "En service"
  | "En maintenance"
  | "En panne"
  | "Désarmé"
  | "Hors service";

// ENTITY: User
export interface User extends Document {
  id: string;
  name: string;
  lastName: string;
  password: string;
  email: string;
  tel: string;
  role: string;
}
// ENTITY: Goods
export interface Goods extends Document {
  id: string;
  itemName: string; // nomMarchandise
  type: string; // typeMarchandise 'fragile','General','agricole'
  embarkDate: string; // embarquement
  quantity: number; // Qte
  unitWeight: number; // Pds U
  totalWeight: number; // Pds T
  unitPrice: number; // Prix U
  totalPrice: number; // Prix Total
  amountToPay: number; // Montant à Payer
  status: boolean;
  state: Etat; // etat
  reservationId: string; // idReservation
  numberLot: string;
  calculationMethod: "option1" | "option2";
  userId: string; // idUser
  tripId: string;
  // payer: boolean;
}

// ENTITY: Reservation
export interface Reservation extends Document {
  id: string;
  clientName: string;
  clientTel: string;
  clientAdresse: string;
  destName: string;
  destTel: string;
  destAdresse: string;
  status: string;
  date: string;
  quantity: number; // Qte
  weight: number; // poids
  totalPrice: number; // Prix Total
  amountPaid: number; // Montant Payé
  amountToPay: number; // Montant à Payer
  paymentStatus: boolean; // statutPaiement
  tripId: string;
  userId: string;
  idCashMovement: string;
  invoiceNumber: string;
  paymentMethod:
    | "Espèces"
    | "Orange Money"
    | "MVola"
    | "Airtel Money"
    | "Chèque";
  paymentRef?: string;
  isConfirmed: boolean;
  validatedBy?: string | null;
  validatedAt?: Date | null;
}

// ENTITY: Trip
export interface Trip extends Document {
  id: string;
  boatId: string;
  depart: string;
  arrive: string;
  loadingStartDate?: string;
  from: string;
  to: string;
  status: string;
  userId: string;
}

// ENTITY: Boat
export interface Boat extends Document {
  id: string;
  name: string;
  capacity: number;
  state: EtatBoat;
  crew: string[]; // équipage
}

// ENTITY: CashMovement
export interface CashMovement extends Document {
  id: string;
  designation: string;
  credit: number;
  debit: number;
  tripId?: string;
  type: "debit" | "credit";
  goodsId?: string; // marchandiseId
  userId: string;
  date: string;
  paymentMode: string;
  payer: string;
}

// ENTITY: FuelConsumption
export interface FuelConsumption extends Document {
  id: string;
  tripId: string;
  quantity: number; // quantité consommée
  fuelType: string;
  fuelPrice: number; // prix unitaire
  cost: number; // coût total
  userId: string;

  remainingFuel?: number; // stock restant

  createdAt?: string;
}
// ENTITY: Menu
export interface Menu extends Document {
  id: string;
  label: string;
  icon: string;
  description?: string | null;
  permission: string;
}

// ENTITY: Role
export interface Role extends Document {
  id: string; // identifiant unique logique
  name: string; // nom du rôle (unique)
  description?: string;
  menus: Menu[]; // références aux menus
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ENTITY: CargoType
export interface CargoType extends Document {
  id: string;
  name: string;
  userId: string;
}
// ENTITY: Notification
export interface Notification extends Document {
  id: string;
  userId: string;
  content: string;
  isRead: boolean;
  reservationId?: string;
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ENTITY: Port
export interface Port extends Document {
  id: string;
  name: string;
  userId: string;
}
