import { supabase } from "../supabaseClient";

export async function fetchAllProjects() {
    const { data, error } = await supabase
        .from("project")
        .select("*")
        .order("project_created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}

/*
 * Every visible sprint's dates, in one query, so the project cards can show each
 * project's timeline.
 */
export async function fetchSprintDates() {
    const { data, error } = await supabase
        .from("sprint")
        .select("project_id, sprint_start_date, sprint_end_date");

    if (error) {
        throw error;
    }

    return data;
}

export async function fetchProject(projectId) {
    const { data, error } = await supabase
        .from("project")
        .select("*")
        .eq("project_id", projectId)
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function addProject({ name, description = "" }) {
    if (!name?.trim()) {
        throw new Error("A project name is required.");
    }

    const { data: projectId, error } = await supabase.rpc("create_project", {
        p_name: name.trim(),
        p_description: description.trim() || null
    });

    if (error) {
        throw error;
    }

    return fetchProject(projectId);
}

export async function renameProject(projectId, name) {
    if (!name?.trim()) {
        throw new Error("A project name is required.");
    }

    const { data, error } = await supabase
        .from("project")
        .update({ project_name: name.trim() })
        .eq("project_id", projectId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function modifyProject(projectId, changes) {
    const update = {};

    if (Object.hasOwn(changes, "name")) {
        if (!changes.name?.trim()) {
            throw new Error("A project name is required.");
        }
        update.project_name = changes.name.trim();
    }

    if (Object.hasOwn(changes, "description")) {
        update.project_desc = changes.description?.trim() || null;
    }

    if (!Object.keys(update).length) {
        throw new Error("Provide a project name or description to update.");
    }

    const { data, error } = await supabase
        .from("project")
        .update(update)
        .eq("project_id", projectId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function deleteProject(projectId) {
    const { data, error } = await supabase.rpc("delete_project", {
        p_project_id: projectId
    });

    if (error) {
        throw error;
    }

    return data;
}
