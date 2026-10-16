import { useEffect, useState } from "react";
import { fetchNotifications, markNotificationRead } from "../services/notificationService";

export function useNotifications(intervalMs = 30000) {
    const [notifications, setNotifications] = useState([]);
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
        const intervalId = window.setInterval(refresh, intervalMs);
        return () => {
            active = false;
            window.clearInterval(intervalId);
        };
    }, [intervalMs]);

    async function markRead(notificationId) {
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

    return { notifications, unreadCount, error, markRead };
}
