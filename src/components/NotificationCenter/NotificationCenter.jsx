import { useEffect, useRef, useState } from "react";
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

export function NotificationPopup({
    notifications,
    error,
    onMarkRead,
    onDelete,
    onRespondToVolunteer,
    onClose
}) {
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
                            className={[
                                "notif-card",
                                notification.notif_is_read ? "is-read" : "is-unread",
                                notification.notif_type === "task_volunteer" ? "is-volunteer-request" : "",
                                notification.notif_type === "task_volunteer"
                                    ? notification.notif_action_status === "pending" ? "is-pending" : "is-complete"
                                    : ""
                            ].filter(Boolean).join(" ")}
                        >
                            <button
                                type="button"
                                className="notif-body"
                                title={!notification.notif_is_read && notification.notif_type !== "task_volunteer"
                                    ? "Mark as read"
                                    : undefined}
                                onClick={() => (
                                    !notification.notif_is_read
                                    && notification.notif_type !== "task_volunteer"
                                    && onMarkRead(notification.notif_id)
                                )}
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
                            {notification.notif_type === "task_volunteer"
                                && notification.notif_action_status === "pending" && (
                                <div className="notif-volunteer-actions">
                                    <button
                                        type="button"
                                        onClick={() => onRespondToVolunteer(notification.notif_id, true)}
                                    >
                                        ACCEPT
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRespondToVolunteer(notification.notif_id, false)}
                                    >
                                        DECLINE
                                    </button>
                                </div>
                            )}
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
    const {
        notifications: items,
        unreadCount,
        error,
        markRead,
        remove,
        respondToVolunteer
    } = notifications;
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
                    onRespondToVolunteer={respondToVolunteer}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
