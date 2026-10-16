import { supabase } from "../supabaseClient";

export async function fetchNotifications(limit = 30) {
    const { data, error } = await supabase
        .from("notification")
        .select("notif_id, notif_message, notif_is_read, notif_delivered_at, notif_read_at, task_id")
        .order("notif_delivered_at", { ascending: false })
        .limit(limit);

    if (error) {
        throw error;
    }

    return data;
}

export async function markNotificationRead(notificationId) {
    const { data, error } = await supabase
        .from("notification")
        .update({
            notif_is_read: true,
            notif_read_at: new Date().toISOString()
        })
        .eq("notif_id", notificationId)
        .select("notif_id")
        .single();

    if (error) {
        throw error;
    }

    return data.notif_id;
}

export async function deleteNotification(notificationId) {
    const { data, error } = await supabase
        .from("notification")
        .delete()
        .eq("notif_id", notificationId)
        .select("notif_id");

    if (error) {
        throw error;
    }

    // Row-level security filters rows silently, so "nothing deleted" is how a
    // missing delete policy shows up.
    if (!data?.length) {
        throw new Error("Could not delete this notification.");
    }
}
