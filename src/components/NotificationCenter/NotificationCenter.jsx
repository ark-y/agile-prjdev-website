import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../../hooks/useNotifications";
import Icon from "../Icons/Icons";
import "./NotificationCenter.css";

function formatDelivered(value) {
    return new Date(value).toLocaleString([], {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit"
    });
}

export function NotificationPopup({ notifications, error, onMarkRead, onDelete, onClose }) {
    return (
        <div className="notif-popup" role="dialog" aria-label="Notifications">
            <header className="notif-popup-header">
                <h2>Notifications</h2>
                <button type="button" onClick={onClose} aria-label="Close notifications">
                    <Icon name="x" size={16} />
                </button>
            </header>

            {error && <p className="notif-error" role="alert">{error}</p>}

            {!notifications.length && !error ? (
                <p className="notif-empty">No notifications yet.</p>
            ) : (
                <ul className="notif-list">
                    {notifications.map((notification) => (
                        <li
                            key={notification.notif_id}
                            className={`notif-card ${notification.notif_is_read ? "is-read" : "is-unread"}`}
                        >
                            <button
                                type="button"
                                className="notif-body"
                                title={notification.notif_is_read ? undefined : "Mark as read"}
                                onClick={() => !notification.notif_is_read && onMarkRead(notification.notif_id)}
                            >
                                <span className="notif-title">
                                    {!notification.notif_is_read && (
                                        <span className="notif-dot" role="img" aria-label="Unread" />
                                    )}
                                    {notification.notif_message}
                                </span>
                                <time dateTime={notification.notif_delivered_at}>
                                    {formatDelivered(notification.notif_delivered_at)}
                                </time>
                            </button>
                            <button
                                type="button"
                                className="notif-delete"
                                aria-label="Delete notification"
                                onClick={() => onDelete(notification.notif_id)}
                            >
                                <Icon name="x" size={14} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/*
 * The bell and its popup. `notifications` is the result of useNotifications(),
 * so a page can also show the unread count elsewhere.
 */
export function NotificationBell({ notifications }) {
    const { notifications: items, unreadCount, error, markRead, remove } = notifications;
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        function handlePointerDown(event) {
            if (!rootRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        }
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div className="notif-bell" ref={rootRef}>
            <button
                type="button"
                className="notif-bell-button"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
            >
                <Icon name="bell" size={20} />
                {unreadCount > 0 && (
                    <span className="notif-badge" aria-hidden="true">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <NotificationPopup
                    notifications={items}
                    error={error}
                    onMarkRead={markRead}
                    onDelete={remove}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}

// The bell pinned to the top right, for pages that have no header of their own.
function NotificationCenter() {
    const notifications = useNotifications();

    return (
        <div className="notification-floating">
            <NotificationBell notifications={notifications} />
        </div>
    );
}

export default NotificationCenter;
