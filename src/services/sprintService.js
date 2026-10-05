import { supabase } from "../supabaseClient";

export async function fetchAllSprints(projectId) {
    let query = supabase.from("sprint").select("*");

    if (projectId) {
        query = query.eq("project_id", projectId);
    }

    const { data, error } = await query.order("sprint_id");

    if (error) {
        throw error;
    }

    return data;
}

export async function fetchSprint(sprintId) {
    const { data, error } = await supabase
        .from("sprint")
        .select("*")
        .eq("sprint_id", sprintId)
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function addSprint({ projectId, name, startDate = null, endDate = null }) {
    if (!projectId) {
        throw new Error("A project is required to create a sprint.");
    }

    if (!name?.trim()) {
        throw new Error("A sprint name is required.");
    }

    if (startDate && endDate && endDate < startDate) {
        throw new Error("Sprint end date must be on or after its start date.");
    }

    const { data, error } = await supabase
        .from("sprint")
        .insert({
            project_id: projectId,
            sprint_name: name.trim(),
            sprint_start_date: startDate || null,
            sprint_end_date: endDate || null
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function modifySprint(sprintId, changes) {
    const columnMap = {
        name: "sprint_name",
        startDate: "sprint_start_date",
        endDate: "sprint_end_date",
        ongoing: "sprint_ongoing"
    };
    const update = {};

    for (const [key, column] of Object.entries(columnMap)) {
        if (Object.hasOwn(changes, key)) {
            const value = changes[key];
            if (key === "name" && !value?.trim()) {
                throw new Error("A sprint name is required.");
            }
            update[column] = key === "name"
                ? value.trim()
                : key === "ongoing"
                    ? value
                    : value || null;
        }
    }

    if (!Object.keys(update).length) {
        throw new Error("Provide at least one sprint field to update.");
    }

    if (Object.hasOwn(changes, "startDate") || Object.hasOwn(changes, "endDate")) {
        const currentSprint = await fetchSprint(sprintId);
        const startDate = Object.hasOwn(changes, "startDate")
            ? changes.startDate
            : currentSprint.sprint_start_date?.slice(0, 10);
        const endDate = Object.hasOwn(changes, "endDate")
            ? changes.endDate
            : currentSprint.sprint_end_date?.slice(0, 10);

        if (startDate && endDate && endDate < startDate) {
            throw new Error("Sprint end date must be on or after its start date.");
        }
    }

    const { data, error } = await supabase
        .from("sprint")
        .update(update)
        .eq("sprint_id", sprintId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function deleteSprint(sprintId) {
    const { data, error } = await supabase
        .from("sprint")
        .delete()
        .eq("sprint_id", sprintId)
        .select("sprint_id")
        .single();

    if (error) {
        throw error;
    }

    return data.sprint_id;
}
