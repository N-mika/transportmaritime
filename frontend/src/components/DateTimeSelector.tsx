// components/DateTimeWheelSelector.tsx
import { FC, useState, useEffect } from "react";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Calendar, Clock } from "lucide-react";

interface DateTimeWheelSelectorProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
}

const DateTimeWheelSelector: FC<DateTimeWheelSelectorProps> = ({
    label,
    value,
    onChange,
    error,
    required = false,
}) => {
    const [showPicker, setShowPicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedHour, setSelectedHour] = useState("12");
    const [selectedMinute, setSelectedMinute] = useState("00");

    // Détection mobile intelligente (Version C)
    const isMobile =
        matchMedia("(pointer: coarse)").matches ||
        window.innerWidth <= 768;

    // Initialisation
    useEffect(() => {
        if (value) {
            try {
                // Utilisez new Date(value) directement pour conserver le fuseau horaire
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    setSelectedDate(date);
                    setSelectedHour(String(date.getHours()).padStart(2, "0"));
                    setSelectedMinute(String(date.getMinutes()).padStart(2, "0"));
                    return;
                }
            } catch (error) {
                console.error("Error parsing date:", error);
            }
        }

        const now = new Date();
        setSelectedDate(now);
        setSelectedHour(String(now.getHours()).padStart(2, "0"));
        setSelectedMinute(String(now.getMinutes()).padStart(2, "0"));
    }, [value]);

    // Data sources
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

    const months = [
        { value: 0, label: "Jan" }, { value: 1, label: "Fév" }, { value: 2, label: "Mar" },
        { value: 3, label: "Avr" }, { value: 4, label: "Mai" }, { value: 5, label: "Jun" },
        { value: 6, label: "Jul" }, { value: 7, label: "Aoû" }, { value: 8, label: "Sep" },
        { value: 9, label: "Oct" }, { value: 10, label: "Nov" }, { value: 11, label: "Déc" }
    ];

    const getDaysInMonth = (year: number, month: number) =>
        new Date(year, month + 1, 0).getDate();

    const days = Array.from(
        { length: getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()) },
        (_, i) => i + 1
    );

    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

    // Handlers
    const handleYearChange = (year: number) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(year);

        const daysInNewMonth = getDaysInMonth(year, newDate.getMonth());
        if (newDate.getDate() > daysInNewMonth) {
            newDate.setDate(daysInNewMonth);
        }

        setSelectedDate(newDate);
    };

    const handleMonthChange = (month: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(month);

        const daysInNewMonth = getDaysInMonth(newDate.getFullYear(), month);
        if (newDate.getDate() > daysInNewMonth) {
            newDate.setDate(daysInNewMonth);
        }

        setSelectedDate(newDate);
    };

    const handleDayChange = (day: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(day);
        setSelectedDate(newDate);
    };

    const handleSave = () => {
        const finalDate = new Date(selectedDate);
        finalDate.setHours(parseInt(selectedHour));
        finalDate.setMinutes(parseInt(selectedMinute));

        // Au lieu de toISOString() qui donne UTC, on formate manuellement en heure locale
        const formatToLocalISO = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        const formattedValue = formatToLocalISO(finalDate);
        onChange(formattedValue);
        setShowPicker(false);
    };


    const displayValue = value
        ? new Date(value).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "Sélectionner une date";

    // Desktop → input datetime-local
    if (!isMobile) {
        return (
            <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </Label>
                <input
                    type="datetime-local"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full p-3 border rounded-md ${error ? "border-red-500" : "border-gray-300"
                        }`}
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
        );
    }

    // Mobile → Roulette
    return (
        <div className="flex flex-col gap-2">
            <Label className="text-card-foreground">
                {label}
                {required && <span className="text-red-500">*</span>}
            </Label>

            <div
                className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer bg-white ${error ? "border-red-500" : "border-gray-300"
                    } ${!value ? "text-gray-500" : ""}`}
                onClick={() => setShowPicker(true)}
            >
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="flex-1">{displayValue}</span>
                <Clock className="h-4 w-4 text-gray-500" />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {showPicker && (
                <div
                    className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowPicker(false)}
                >
                    <div
                        className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b bg-gray-50">
                            <h3 className="text-lg font-semibold text-center">{label}</h3>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {/* Date wheels */}
                            <div className="mb-6">
                                <Label className="text-sm font-medium mb-3 block text-center">
                                    Date
                                </Label>

                                <div className="flex gap-2 justify-between">
                                    {/* Jour */}
                                    <div className="flex-1">
                                        <select
                                            value={selectedDate.getDate()}
                                            onChange={(e) => handleDayChange(Number(e.target.value))}
                                            className="w-full p-3 border border-gray-300 rounded-md text-center bg-white"
                                            size={5}
                                        >
                                            {days.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                        <div className="text-center text-xs text-gray-500 mt-2">Jour</div>
                                    </div>

                                    {/* Mois */}
                                    <div className="flex-1">
                                        <select
                                            value={selectedDate.getMonth()}
                                            onChange={(e) => handleMonthChange(Number(e.target.value))}
                                            className="w-full p-3 border border-gray-300 rounded-md text-center bg-white"
                                            size={5}
                                        >
                                            {months.map((m) => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                        <div className="text-center text-xs text-gray-500 mt-2">Mois</div>
                                    </div>

                                    {/* Année */}
                                    <div className="flex-1">
                                        <select
                                            value={selectedDate.getFullYear()}
                                            onChange={(e) => handleYearChange(Number(e.target.value))}
                                            className="w-full p-3 border border-gray-300 rounded-md text-center bg-white"
                                            size={5}
                                        >
                                            {years.map((y) => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                        <div className="text-center text-xs text-gray-500 mt-2">Année</div>
                                    </div>
                                </div>
                            </div>

                            {/* Time wheels */}
                            <div className="mb-4">
                                <Label className="text-sm font-medium mb-3 block text-center">Heure</Label>

                                <div className="flex gap-3 justify-center">
                                    {/* Heures */}
                                    <div className="flex-1">
                                        <select
                                            value={selectedHour}
                                            onChange={(e) => setSelectedHour(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-md text-center bg-white"
                                            size={5}
                                        >
                                            {hours.map((h) => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                        <div className="text-center text-xs text-gray-500 mt-2">Heures</div>
                                    </div>

                                    {/* Minutes */}
                                    <div className="flex-1">
                                        <select
                                            value={selectedMinute}
                                            onChange={(e) => setSelectedMinute(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-md text-center bg-white"
                                            size={5}
                                        >
                                            {minutes.map((m) => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <div className="text-center text-xs text-gray-500 mt-2">Minutes</div>
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-200">
                                <div className="text-sm text-blue-600 mb-1">Sélection actuelle :</div>
                                <div className="font-semibold text-blue-800">
                                    {selectedDate.toLocaleDateString("fr-FR")} à {selectedHour}h{selectedMinute}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t bg-gray-50 flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowPicker(false)}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="button"
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={handleSave}
                            >
                                Confirmer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateTimeWheelSelector;
