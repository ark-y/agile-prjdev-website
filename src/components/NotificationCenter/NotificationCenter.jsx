import { useEffect, useState } from "react";
import { fetchNotifications, markNotificationRead } from "../../services/notificationService";
import "./NotificationCenter.css";

function NotificationCenter() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function refresh() {
            try {
                const data = await fetchNotifications();
                if (active) {
                    setNotifications(data);
                    setError("");
                }
            } catch (loadError) {
                if (active) {
                    setError(loadError.message || "Could not load notifications.");
                }
            }
        }

        refresh();
        const intervalId = window.setInterval(refresh, 30000);
        return () => {
            active = false;
            window.clearInterval(intervalId);
        };
    }, []);

    async function handleMarkRead(notificationId) {
        try {
            await markNotificationRead(notificationId);
            setNotifications((current) => current.map((notification) =>
                notification.notif_id === notificationId
                    ? { ...notification, notif_is_read: true, notif_read_at: new Date().toISOString() }
                    : notification
            ));
        } catch (updateError) {
            setError(updateError.message || "Could not update the notification.");
        }
    }

    const unreadCount = notifications.filter((notification) => !notification.notif_is_read).length;

    return (
        <section className="notification-center">
            <button
                type="button"
                className="notification-toggle"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
            >
                <span aria-hidden="true">{"\u{1F514}"}</span>
                {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
            </button>

            {isOpen && (
                <aside className="notification-panel" aria-label="Notifications">
                    <header>
                        <h2>Notifications</h2>
                        <button type="button" onClick={() => setIsOpen(false)} aria-label="Close notifications">
                            ×
                        </button>
                    </header>
                    {error && <p role="alert">{error}</p>}
                    {!notifications.length && !error ? <p>No notifications yet.</p> : (
                        <ul>
                            {notifications.map((notification) => (
                                <li key={notification.notif_id} className={notification.notif_is_read ? "is-read" : "is-unread"}>
                                    <p>{notification.notif_message}</p>
                                    <time dateTime={notification.notif_delivered_at}>
                                        {new Date(notification.notif_delivered_at).toLocaleString()}
                                    </time>
                                    {!notification.notif_is_read && (
                                        <button type="button" onClick={() => handleMarkRead(notification.notif_id)}>
                                            Mark read
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>
            )}
        </section>
    );
}

export default NotificationCenter;
