import { FC, useEffect, useState } from "react";
import { onGetService } from "../data/service";
import { AuditLog } from "../data/type";
// import { findUser } from "../Tools/Tools";
import { useSelector } from "react-redux";
import { RootState } from "../redux";
import AuditModal from "../components/AuditModal";
import { Calendar, Database, Filter, Search } from "lucide-react";
import { HeaderSection } from "../components/ui/HeaderSection";
import useFinders from "../Tools/finders";

type types =
  | "Goods"
  | "User"
  | "Reservation"
  | "Trip"
  | "Boat"
  | "CashMovement"
  | "FuelConsumption"
  | "Role"
  | "CargoType";
  

const AuditLogs: FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModalAudit, setShowModalAudit] = useState<boolean>(false);
  const [auditShow, setAuditShow] = useState<{ idAudit: string; type: types }>();

  const {findUser } = useFinders()
  // 🔍 filtres
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterCollection, setFilterCollection] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");

  const allUser = useSelector((state: RootState) => state.users.allUser);

  // 🔹 Récupération des logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await onGetService<AuditLog>("allaudit");
        setLogs(response);
        setFilteredLogs(response);
      } catch (error) {
        console.error("Erreur lors de la récupération des logs", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // 🔹 Fonction de filtrage par période
  const isDateInRange = (dateStr: string, range: string) => {
    const date = new Date(dateStr);
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay()); // dimanche
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (range) {
      case "today":
        return date >= startOfToday;
      case "week":
        return date >= startOfWeek;
      case "month":
        return date >= startOfMonth;
      default:
        return true;
    }
  };

  // 🔹 Application des filtres combinés
  useEffect(() => {
    const lowerSearch = search.toLowerCase();

    const result = logs.filter((log) => {
      const user = findUser(log.userId);
      const fullName = `${user.name} ${user.lastName}`.toLowerCase();

      const matchesSearch =
        fullName.includes(lowerSearch) ||
        log.documentId.toLowerCase().includes(lowerSearch) ||
        log.collectionName.toLowerCase().includes(lowerSearch);

      const matchesAction =
        filterAction === "all" ? true : log.action === filterAction;

      const matchesCollection =
        filterCollection === "all" ? true : log.collectionName === filterCollection;

      const matchesDate = isDateInRange(log.createdAt, filterDate);

      return matchesSearch && matchesAction && matchesCollection && matchesDate;
    });

    setFilteredLogs(result);
  }, [search, filterAction, filterCollection, filterDate, logs, allUser]);

  if (loading) {
    return <p className="text-center p-4">Chargement des logs...</p>;
  }

  return (
    <div className="flex flex-col h-[90vh] ">
      <div className="flex-shrink-0 space-y-6 pb-4 bg-white z-20">
        <HeaderSection subtitle="Suivie des action" title="Audit Logs"></HeaderSection>
        <div className="bg-white shadow-md border rounded-xl p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur, collection ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 focus:border-primary focus:ring focus:ring-primary/20 outline-none transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="all">Toutes les actions</option>
              <option value="create">Ajout</option>
              <option value="update">Modification</option>
              <option value="delete">Suppression</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Database className="text-gray-400 w-5 h-5" />
            <select
              value={filterCollection}
              onChange={(e) => setFilterCollection(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="all">Toutes les collections</option>
              <option value="User">Utilisateur</option>
              <option value="Boat">Bateau</option>
              <option value="Trip">Voyage</option>
              <option value="Reservation">Réservation</option>
              <option value="Goods">Marchandise</option>
              <option value="CashMovement">Encaissement</option>
              <option value="FuelConsumption">Consommation carburant</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="text-gray-400 w-5 h-5" />
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd’hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois-ci</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-4 border border-gray-200 rounded-xl shadow-sm bg-white">
        {filteredLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            Aucun log trouvé 🕵️‍♂️
          </p>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 bg-gray-100 text-gray-600 uppercase text-xs z-10">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Collection</th>
                <th className="px-4 py-3">Document ID</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((log) => {
                const user = findUser(log.userId);
                return (
                  <tr
                    key={log._id}
                    className="hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => {
                      setAuditShow({
                        idAudit: log.after.id,
                        type: log.collectionName,
                      });
                      setShowModalAudit(true);
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {log.action === "create"
                        ? "Ajout"
                        : log.action === "delete"
                          ? "Suppression"
                          : "Modification"}
                    </td>
                    <td className="px-4 py-3">{log.collectionName}</td>
                    <td className="px-4 py-3 text-gray-500">{log.documentId}</td>
                    <td className="px-4 py-3">{`${user.name} ${user.lastName}`}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModalAudit && auditShow && (
        <AuditModal
          idAfter={auditShow.idAudit}
          onClose={() => setShowModalAudit(false)}
          type={auditShow.type}
        />
      )}
    </div>
  );

};

export default AuditLogs;
