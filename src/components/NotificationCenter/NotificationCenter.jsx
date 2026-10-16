import { useState } from "react";
import { useNotifications } from "../../hooks/useNotifications";
import "./NotificationCenter.css";

export function NotificationPanel({ notifications, error, onMarkRead, onClose }) {
    return (
        <aside className="notification-panel" aria-label="Notifications">
            <header>
                <h2>Notifications</h2>
                <button type="button" onClick={onClose} aria-label="Close notifications">
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
                                <button type="button" onClick={() => onMarkRead(notification.notif_id)}>
                                    Mark read
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    );
}

function NotificationCenter() {
    const { notifications, unreadCount, error, markRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

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
                <NotificationPanel
                    notifications={notifications}
                    error={error}
                    onMarkRead={markRead}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </section>
    );
}

export default NotificationCenter;
