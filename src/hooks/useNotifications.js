import { useEffect, useState } from "react";
import {
    deleteNotification,
    fetchNotifications,
    markNotificationRead,
    respondToTaskVolunteer
} from "../services/notificationService";

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

    async function remove(notificationId) {
        try {
            await deleteNotification(notificationId);
            setNotifications((current) => current.filter((notification) => notification.notif_id !== notificationId));
            setError("");
        } catch (deleteError) {
            const blocked = deleteError.code === "42501"
                || /permission denied|row-level security|could not delete/i.test(deleteError.message || "");
            setError(
                blocked
                    ? "Deleting notifications needs the 20261008_notification_delete.sql migration to be applied in Supabase."
                    : deleteError.message || "Could not delete the notification."
            );
        }
    }

    async function respondToVolunteer(notificationId, accept) {
        const notification = notifications.find((item) => item.notif_id === notificationId);

        try {
            await respondToTaskVolunteer(notificationId, accept);
            setNotifications((current) => current.map((item) =>
                item.notif_id === notificationId
                    ? {
                        ...item,
                        notif_is_read: true,
                        notif_read_at: new Date().toISOString(),
                        notif_action_status: accept ? "accepted" : "declined"
                    }
                    : item
            ));
            setError("");

            if (accept && notification?.task_id && notification?.notif_volunteer_id) {
                window.dispatchEvent(new CustomEvent("task-volunteer-accepted", {
                    detail: {
                        taskId: notification.task_id,
                        developerId: notification.notif_volunteer_id
                    }
                }));
            }
        } catch (actionError) {
            const missingMigration = actionError.code === "PGRST202"
                || /could not find the function/i.test(actionError.message || "");
            setError(
                missingMigration
                    ? "Task volunteer notifications need the 20261010_task_volunteer_notifications.sql migration to be applied in Supabase."
                    : actionError.message || "Could not respond to the volunteer request."
            );
        }
    }

    const unreadCount = notifications.filter((notification) => !notification.notif_is_read).length;

    return { notifications, unreadCount, error, markRead, remove, respondToVolunteer };
}
