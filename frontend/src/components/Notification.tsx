import { useEffect, useState, useRef } from "react";
import { Bell, Trash2 } from "lucide-react";
import {
    onDeleteService,
    onGetService,
    onUpdateService,
} from "../data/service";
import { Notification, User } from "../data/type";
import { createPortal } from "react-dom";
import { TABLE_DATA_BASE } from "../data/type";
import { toast } from "react-toastify";

interface NotificationBellProps {
    user: User;
    onNavigateToReservation?: (reservationId: string) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ user, onNavigateToReservation }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);
    const [swiping, setSwiping] = useState<{ [key: string]: number }>({});
    const touchStartX = useRef<number | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState<{ top: number; left: number }>({
        top: 0,
        left: 0,
    });

    // Récupération des notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.id) return;
            try {
                // Récupérer toutes les notifications depuis l'API
                const allNotifications = await onGetService<Notification>(
                    TABLE_DATA_BASE.NOTIFICATION
                );
                // Filtrer côté frontend pour l'utilisateur courant
                const userNotifications = allNotifications.filter(
                    (notif: Notification) => notif.userId === user.id
                );
                // Trier par date de création (les plus récentes en premier)
                const sortedNotifications = userNotifications.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });
                setNotifications(sortedNotifications);
            } catch (err) {
                console.error("Erreur récupération notifications :", err);
            }
        };

        fetchNotifications();

        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, [user]);

    // Gérer la fermeture quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!open) return;

            const popupElement = document.querySelector('[data-notification-popup]');
            const isClickInsidePopup = popupElement?.contains(e.target as Node);
            const isClickOnBell = buttonRef.current?.contains(e.target as Node);

            if (!isClickInsidePopup && !isClickOnBell) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    // Calcul de la position du popup
    useEffect(() => {
        if (open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 8,
                left: Math.max(rect.left + window.scrollX - 150, 10),
            });
        }
    }, [open]);

    // Fonctions swipe + suppression
    const handleTouchStart = (e: React.TouchEvent, notifId: string) => {
        touchStartX.current = e.targetTouches[0].clientX;
        setSwiping((prev) => ({ ...prev, [notifId]: 0 }));
    };
    const handleTouchMove = (e: React.TouchEvent, notifId: string) => {
        if (!touchStartX.current) return;
        const diff = e.targetTouches[0].clientX - touchStartX.current;
        setSwiping((prev) => ({ ...prev, [notifId]: diff }));
    };
    const handleTouchEnd = (notifId: string) => {
        const distance = swiping[notifId] || 0;
        if (Math.abs(distance) > 100) handleDelete(notifId);
        setSwiping((prev) => ({ ...prev, [notifId]: 0 }));
        touchStartX.current = null;
    };

    const handleMarkAsRead = async (notif: Notification) => {
        if (notif.isRead) return;
        try {
            await onUpdateService(TABLE_DATA_BASE.NOTIFICATION, {
                ...notif,
                isRead: true,
                updatedAt: new Date()
            });
            setNotifications((prev) =>
                prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
            );
        } catch (err) {
            console.error("Erreur mise à jour :", err);
        }
    };

    const handleDelete = async (notifId: string) => {
        try {
            const res = await onDeleteService(TABLE_DATA_BASE.NOTIFICATION, notifId);
            if (res === "success") {
                setNotifications((prev) => prev.filter((n) => n.id !== notifId));
                toast.success("Notification supprimée");

                setOpen(false);
            }
        } catch (err) {
            console.error("Erreur suppression notification :", err);
            toast.error("Erreur lors de la suppression de la notification.");
        }
    };

    // Gérer le clic sur une notification
    const handleNotificationClick = async (notif: Notification) => {
        try {

            await handleMarkAsRead(notif);

            if (notif.reservationId) {

                localStorage.setItem("highlightReservation", notif.reservationId);
                localStorage.setItem("scrollToReservation", "true");
                localStorage.setItem("focusPaymentButton", "true");
            }

            if (onNavigateToReservation) {
                onNavigateToReservation(notif.reservationId || notif.id);
            } else {
                console.warn("onNavigateToReservation non défini");
            }

            setOpen(false);
        } catch (err) {
            console.error("Erreur lors du clic sur la notification :", err);
            toast.error("Impossible d'ouvrir la réservation");
        }
    };


    // Marquer toutes comme lues
    const markAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.isRead);
            const updatePromises = unreadNotifications.map(notif =>
                onUpdateService(TABLE_DATA_BASE.NOTIFICATION, {
                    ...notif,
                    isRead: true,
                    updatedAt: new Date()
                })
            );

            await Promise.all(updatePromises);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success("Toutes les notifications marquées comme lues");
        } catch (err) {
            console.error("Erreur marquer tout comme lu :", err);
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Formater la date
    const formatNotificationDate = (date: Date | undefined) => {
        if (!date) return "";
        const now = new Date();
        const notifDate = new Date(date);
        const diffMs = now.getTime() - notifDate.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours} h`;
        if (diffDays === 1) return "Hier";
        if (diffDays < 7) return `Il y a ${diffDays} j`;
        return notifDate.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
        });
    };

    // === Rendu ===
    return (
        <>
            {/* Bouton cloche */}
            <button
                ref={buttonRef}
                onClick={() => setOpen(!open)}
                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-primary hover:bg-primary/90 transition-all duration-200 shadow-md"
            >
                <Bell className="text-white w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Fenêtre flottante : rendue dans le body */}
            {open &&
                createPortal(
                    <div
                    data-notification-popup="true"
                        style={{
                            position: "absolute",
                            top: position.top,
                            left: position.left,
                        }}
                        className="bg-background text-foreground shadow-2xl rounded-xl p-4 w-80 max-h-[70vh] overflow-y-auto z-50 border border-border"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-lg text-foreground">
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                >
                                    Tout marquer comme lu
                                </button>
                            )}
                        </div>

                        {notifications.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Aucune notification
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNotificationClick(notif);
                                        }}
                                        onTouchStart={(e) => handleTouchStart(e, notif.id)}
                                        onTouchMove={(e) => handleTouchMove(e, notif.id)}
                                        onTouchEnd={() => handleTouchEnd(notif.id)}
                                        style={{
                                            transform: `translateX(${swiping[notif.id] || 0}px)`,
                                            opacity: Math.abs(swiping[notif.id] || 0) > 100 ? 0.3 : 1,
                                            transition: "transform 0.25s ease, opacity 0.3s ease",
                                        }}
                                        className={`relative p-3 border rounded-lg text-sm cursor-pointer transition-all duration-200 ${notif.isRead
                                            ? "bg-muted text-muted-foreground border-muted-foreground/20"
                                            : "bg-primary/10 hover:bg-primary/20 text-foreground border-primary/30 shadow-sm"
                                            }`}
                                    >
                                        <div className="pr-6">
                                            <p className="text-sm leading-snug font-medium">{notif.content}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatNotificationDate(notif.createdAt)}
                                            </p>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="absolute top-3 left-2 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(notif.id);
                                            }}
                                            className="absolute right-2 top-3 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>,
                    document.body
                )}
        </>
    );
};

export default NotificationBell;