import {
  CashMovement,
} from "../data/type";
import {
  parseISO,
  format,
  getISOWeek,
  getMonth,
  getQuarter,
  getYear,
} from "date-fns";
import { fr } from "date-fns/locale";
export interface FieldDefinition<T> {
  key: keyof T
  label: string
  required?: boolean
  type?: "text" | "number" | "email" | "tel" | "date" | "datetime-local" | "select"
  placeHolder?: string
}

export const formatCurrency = (amount: number) => {
  return (
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
    }).format(amount) + " Ar"
  );
};

export const formatCityName = (name: string): string => {
  if (!name) return "";
  const firstLetter = name.charAt(0).toUpperCase();
  const lastPart = name.slice(-2).toLowerCase();
  return `${firstLetter}/${lastPart}`;
};

export const formatOnlyDate = (date: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDate = (date: string) => {
  if (!date) return "";
  const dateR = new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return dateR;
};

// Pour le data du dashBoard
export const generateRevenueDataSets = (cashMouvement: CashMovement[]) => {
  // Helper pour parser les dates
  const parseDate = (d: string) => parseISO(d);

  // Agrégateur générique
  const aggregateBy = (
    getKey: (date: Date) => string,
    formatDate: (date: Date) => string
  ) => {
    const map = new Map<string, { revenus: number; date: string }>();

    cashMouvement.forEach((cm) => {
      const d = parseDate(cm.date);
      const key = getKey(d);
      const display = formatDate(d);
      const revenus = (cm.credit || 0) - (cm.debit || 0);

      if (!map.has(key)) {
        map.set(key, { revenus: 0, date: display });
      }
      map.get(key)!.revenus += revenus / 1000; // en milliers pour être lisible
    });

    return Array.from(map, ([periode, { revenus, date }]) => ({
      periode,
      revenus: Number(revenus.toFixed(1)),
      date,
    }));
  };

  return {
    hebdomadaire: aggregateBy(
      (d) => "S" + getISOWeek(d),
      (d) => format(d, "dd MMM", { locale: fr })
    ),
    mensuelle: aggregateBy(
      (d) => format(d, "MMM", { locale: fr }),
      (d) => format(d, "MMMM yyyy", { locale: fr })
    ),
    trimestrielle: aggregateBy(
      (d) => "T" + getQuarter(d) + " " + getYear(d),
      (d) => {
        const q = getQuarter(d);
        const y = getYear(d);
        const labels = ["Jan-Mar", "Avr-Juin", "Juil-Sep", "Oct-Déc"];
        return `${labels[q - 1]} ${y}`;
      }
    ),
    semestrielle: aggregateBy(
      (d) => (getMonth(d) < 6 ? "S1" : "S2") + " " + getYear(d),
      (d) => (getMonth(d) < 6 ? "Jan-Juin" : "Juil-Déc") + " " + getYear(d)
    ),
    annuelle: aggregateBy(
      (d) => getYear(d).toString(),
      (d) => "Année " + getYear(d)
    ),
  };
};

export const formatHour = (date: string): string => {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getDuration = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  const diffMs = Math.abs(e.getTime() - s.getTime()); // différence en ms

  const totalSeconds = Math.floor(diffMs / 1000);
  const heures = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secondes = totalSeconds % 60;

  return `${heures.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secondes.toString().padStart(2, "0")}`;
};

export const hasChanges = (
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  ignoreKeys: string[] = []
): boolean => {
  for (const key of Object.keys(newObj)) {
    if (ignoreKeys.includes(key)) continue;
    if (newObj[key] !== oldObj[key]) {
      return true;
    }
  }
  return false;
};

export const validateForm = <T>(data: T, fields: FieldDefinition<T>[]) => {
  const errors: Record<string, string> = {};
  fields.forEach(({ key, label, required }) => {
    const value = (data[key] ?? "").toString().trim();
    if (required && (value === "" || value === "undefined" || value === "null")) {
      errors[key as string] = `${label} est obligatoire`;
    }
  });
  return errors;
};
