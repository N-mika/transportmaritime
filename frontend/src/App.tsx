import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import CashMouvement from "./Page/CashMovement";
import Goods from "./Page/Goods";
import Trip from "./Page/Trip";
import BoatComponant from "./Page/Boat";
import Dashboard from "./Page/Dashboard";
import PersonnelManagement from "./components/PersonnelManagement";
import { ToastContainer } from 'react-toastify';
import Profile from "./components/Profile";
import FuelConsumption from "./Page/FuelConsumption";
import Audit from "./Page/Audit";
import { useSelector } from "react-redux";
import { RootState } from "./redux";
import { fetchDatabase } from "./redux/thunk/featchData";
import { useAppDispatch } from "./redux/hooks";
import Loader from "./components/tools/Loader";
import { useNavigate } from "react-router-dom";

const VALID_TABS = [
  "dashboard",
  "merchandise",
  "casing",
  "boat",
  "trajets",
  "employe",
  "profile",
  "fueldManage",
  "Audit"
];

const App = () => {
  const loading = useSelector((state: RootState) => state.stJude.loadingAll);
  const currentUser = useSelector((state: RootState) => state.users.currentUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  /** 🔥 1 — Récupérer le hash AVANT tout */
  const getInitialTab = () => {
    const hash = window.location.hash.replace("#", "");
    if (VALID_TABS.includes(hash)) return hash;

    // Si pas de hash → règle selon rôle
    if (currentUser?.role === "Propriétaire") return "dashboard";
    return "profile";
  };

  /** 🔥 2 — Lazy init (IMPORTANT) */
  const [activeTab, setActiveTab] = useState(() => getInitialTab());

  useEffect(() => {
    dispatch(fetchDatabase());
  }, []);

  /** 🔥 3 — Écoute unique du hash */
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (VALID_TABS.includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);

    // Lecture initiale du hash
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  /** Navigation manuelle */
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  /** Navigation depuis notifications */
  const handleNavigateFromNotification = (reservationId: string) => {
    if (!reservationId) return;

    localStorage.setItem("highlightReservation", reservationId);
    localStorage.setItem("scrollToReservation", "true");
    localStorage.setItem("focusPaymentButton", "true");

    navigate(`/#merchandise`);
    setActiveTab("merchandise");

    setTimeout(() => {
      window.location.hash = "merchandise";
    }, 100);
  };

  const handleSetToAudit = (value: string) => {
    if (value === "Audit") {
      setActiveTab("Audit");
      window.location.hash = "Audit";
    }
  };

  /** Rendu des pages */
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            onSetToAudit={handleSetToAudit}
            onNavigateToReservation={handleNavigateFromNotification}
          />
        );
      case "merchandise":
        return <Goods />;
      case "casing":
        return <CashMouvement onSetTofeuldManage={handleTabChange} />;
      case "boat":
        return <BoatComponant />;
      case "trajets":
        return <Trip />;
      case "employe":
        return <PersonnelManagement />;
      case "profile":
        return <Profile />;
      case "fueldManage":
        return <FuelConsumption />;
      case "Audit":
        return <Audit />;
      default:
        return <Profile />;
    }
  };

  return (
    <div className="size-full flex bg-background">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      {loading ? (
        <Loader fullscreen />
      ) : (
        <main className="w-full h-[100vh] overflow-auto">
          <div className="p-4">{renderContent()}</div>

          <ToastContainer
            position="top-center"
            autoClose={7000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </main>
      )}
    </div>
  );
};

export default App;
