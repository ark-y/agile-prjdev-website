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
 * Everything the admin landing needs to summarise every visible project in
 * three queries instead of three per project: sprints, tasks with their status
 * name, and members with their role.
 */
export async function fetchProjectSummaryData() {
    const [sprintsResult, tasksResult, membersResult] = await Promise.all([
        supabase
            .from("sprint")
            .select("sprint_id, project_id, sprint_name, sprint_start_date, sprint_end_date")
            .order("sprint_id"),
        supabase
            .from("task")
            .select("task_id, project_id, sprint_id, task_status:status!task_task_status_id_fkey(status_name)"),
        supabase
            .from("project_member")
            .select("project_id, user:user!project_member_user_id_fkey(user_id, user_first_name, user_last_name, user_pref_name, role:role!user_role_id_fkey(role_name))")
    ]);

    for (const { error } of [sprintsResult, tasksResult, membersResult]) {
        if (error) {
            throw error;
        }
    }

    return {
        sprints: sprintsResult.data,
        tasks: tasksResult.data,
        members: membersResult.data
    };
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
