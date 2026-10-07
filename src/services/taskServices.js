import { supabase } from "../supabaseClient";
import { getCurrentProfileId } from "./serviceHelpers";

function throwIfError(error) {
    if (error) {
        throw error;
    }
}

export async function updateAssignedTaskStatus(taskId, statusId) {
    const { data, error } = await supabase.rpc("update_assigned_task_status", {
        p_task_id: taskId,
        p_status_id: statusId
    });

    throwIfError(error);
    return data;
}

export async function fetchAllTasks({ projectId, sprintId } = {}) {
    let query = supabase
        .from("task")
        .select("*, task_status:status!task_task_status_id_fkey(status_name, status_color)");

    if (projectId) {
        query = query.eq("project_id", projectId);
    }

    if (sprintId) {
        query = query.eq("sprint_id", sprintId);
    }

    const { data, error } = await query.order("task_created_at", {
        ascending: false
    });

    throwIfError(error);
    return data;
}

export async function fetchTask(taskId) {
    const { data, error } = await supabase
        .from("task")
        .select("*, task_status:status!task_task_status_id_fkey(status_name, status_color)")
        .eq("task_id", taskId)
        .single();

    throwIfError(error);
    return data;
}

export async function fetchTaskStatuses(projectId) {
    const { data: projectStatuses, error: projectStatusError } = await supabase
        .from("project_status")
        .select("status_id")
        .eq("project_id", projectId);

    throwIfError(projectStatusError);

    if (!projectStatuses.length) {
        return [];
    }

    const { data, error } = await supabase
        .from("status")
        .select("status_id, status_name, status_color, status_is_default")
        .in("status_id", projectStatuses.map(({ status_id }) => status_id))
        .order("status_id");
    throwIfError(error);
    return data;
}

export async function fetchProjectTags(projectId) {
    const { data, error } = await supabase
        .from("tag")
        .select("tag_id, project_id, tag_name, tag_colour, tag_desc")
        .eq("project_id", projectId)
        .order("tag_name");

    throwIfError(error);
    return data;
}

export async function fetchTaskTagIds(taskIds = []) {
    if (!taskIds.length) {
        return {};
    }

    const { data, error } = await supabase
        .from("task_tag")
        .select("task_id, tag_id")
        .in("task_id", taskIds);

    throwIfError(error);
    return data.reduce((tagsByTask, row) => {
        const taskId = String(row.task_id);
        tagsByTask[taskId] ??= [];
        tagsByTask[taskId].push(String(row.tag_id));
        return tagsByTask;
    }, {});
}

export async function addProjectTag({ projectId, name, colour = "#3F9B76", description = "" }) {
    if (!name?.trim()) {
        throw new Error("A tag name is required.");
    }

    const { data, error } = await supabase
        .from("tag")
        .insert({
            project_id: projectId,
            tag_name: name.trim(),
            tag_colour: colour,
            tag_desc: description.trim() || name.trim()
        })
        .select()
        .single();

    throwIfError(error);
    return data;
}

export async function deleteProjectTag(projectId, tagId) {
    const { data, error } = await supabase.rpc("delete_project_tag", {
        p_project_id: projectId,
        p_tag_id: Number(tagId)
    });

    throwIfError(error);
    return data;
}

export async function setTaskTags(taskId, tagIds = []) {
    const { error } = await supabase.rpc("set_task_tags", {
        p_task_id: taskId,
        p_tag_ids: [...new Set(tagIds.map(Number).filter(Number.isInteger))]
    });

    throwIfError(error);
}

export async function fetchTaskComments(taskId) {
    const { data, error } = await supabase
        .from("comment")
        .select("comment_id, task_id, user_id, task_comm_message, task_comm_created_at, user:user!task_comment_user_id_fkey(user_first_name, user_last_name, user_pref_name)")
        .eq("task_id", taskId)
        .order("task_comm_created_at");

    throwIfError(error);
    return data;
}

export async function addTaskComment(taskId, message) {
    if (!message?.trim()) {
        throw new Error("A comment cannot be empty.");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    throwIfError(authError);
    if (!user) {
        throw new Error("Sign in before commenting.");
    }

    const { data, error } = await supabase
        .from("comment")
        .insert({
            task_id: taskId,
            user_id: user.id,
            task_comm_message: message.trim()
        })
        .select("comment_id, task_id, user_id, task_comm_message, task_comm_created_at, user:user!task_comment_user_id_fkey(user_first_name, user_last_name, user_pref_name)")
        .single();

    throwIfError(error);
    return data;
}

export async function deleteTaskComment(commentId) {
    const { error } = await supabase
        .from("comment")
        .delete()
        .eq("comment_id", commentId);

    throwIfError(error);
}

export async function fetchProjectMembers(projectId) {
    const { data, error } = await supabase
        .from("project_member")
        .select("user_id, user:user!project_member_user_id_fkey(user_id, user_first_name, user_last_name, user_pref_name, user_email, role:role!user_role_id_fkey(role_name))")
        .eq("project_id", projectId);

    throwIfError(error);
    return data.map(({ user }) => user).filter(Boolean);
}

export async function fetchTaskAssignees(taskId) {
    const { data, error } = await supabase
        .from("task_member")
        .select("user_id")
        .eq("task_id", taskId);

    throwIfError(error);
    return data.map(({ user_id }) => user_id);
}

export async function addTask({
    projectId,
    sprintId,
    name,
    description = "",
    priority,
    weight,
    deadline = null,
    statusId = null,
    assigneeIds = [],
    checklists = []
}) {
    if (!name?.trim()) {
        throw new Error("A task name is required.");
    }

    if (!projectId) {
        throw new Error("A project is required to create a task.");
    }

    if (!["high", "medium", "low"].includes(priority)) {
        throw new Error("Choose a valid task priority.");
    }

    if (!Number.isInteger(Number(weight)) || Number(weight) < 1 || Number(weight) > 10) {
        throw new Error("Task weight must be a whole number from 1 to 10.");
    }

    const profileId = await getCurrentProfileId();
    const { data: task, error } = await supabase
        .from("task")
        .insert({
            project_id: projectId,
            sprint_id: sprintId,
            task_name: name.trim(),
            task_desc: description?.trim() || null,
            task_priority: priority,
            task_weight: Number(weight),
            task_deadline: deadline,
            task_status_id: statusId,
            task_checklists: checklists,
            task_created_by: profileId
        })
        .select()
        .single();

    throwIfError(error);

    try {
        await replaceTaskAssignees(task.task_id, assigneeIds);
    } catch (assignmentError) {
        const { error: rollbackError } = await supabase
            .from("task")
            .delete()
            .eq("task_id", task.task_id);

        if (rollbackError) {
            throw new AggregateError(
                [assignmentError, rollbackError],
                "Task assignment failed and the newly created task could not be removed."
            );
        }

        throw assignmentError;
    }

    return task;
}

export async function modifyTask(taskId, changes) {
    if (!taskId) {
        throw new Error("A task ID is required to update a task.");
    }

    if (Object.hasOwn(changes, "name") && !changes.name?.trim()) {
        throw new Error("A task name is required.");
    }

    if (
        Object.hasOwn(changes, "weight") &&
        (!Number.isInteger(Number(changes.weight))
            || Number(changes.weight) < 1
            || Number(changes.weight) > 10)
    ) {
        throw new Error("Task weight must be a whole number from 1 to 10.");
    }

    if (
        Object.hasOwn(changes, "priority")
        && !["high", "medium", "low"].includes(changes.priority)
    ) {
        throw new Error("Choose a valid task priority.");
    }

    const columnMap = {
        name: "task_name",
        description: "task_desc",
        priority: "task_priority",
        weight: "task_weight",
        deadline: "task_deadline",
        sprintId: "sprint_id",
        statusId: "task_status_id",
        checklists: "task_checklists"
    };
    const update = {};

    for (const [key, column] of Object.entries(columnMap)) {
        if (Object.hasOwn(changes, key)) {
            const value = changes[key];
            update[column] = key === "name"
                ? value.trim()
                : key === "description"
                    ? value?.trim() || null
                    : key === "weight" && value !== null
                        ? Number(value)
                        : value;
        }
    }

    if (!Object.keys(update).length) {
        throw new Error("Provide at least one task field to update.");
    }

    const { data, error } = await supabase
        .from("task")
        .update(update)
        .eq("task_id", taskId)
        .select()
        .single();

    throwIfError(error);
    return data;
}

export async function deleteTask(taskId) {
    const { data, error } = await supabase
        .from("task")
        .delete()
        .eq("task_id", taskId)
        .select("task_id")
        .single();

    throwIfError(error);
    return data.task_id;
}

export async function assignTask(taskId, userId) {
    const currentAssigneeIds = await fetchTaskAssignees(taskId);
    await replaceTaskAssignees(taskId, [...currentAssigneeIds, userId]);
}

export async function setTaskAssignees(taskId, userIds) {
    await replaceTaskAssignees(taskId, userIds);
}

export async function unassignTask(taskId, userId) {
    const { error } = await supabase
        .from("task_member")
        .delete()
        .eq("task_id", taskId)
        .eq("user_id", userId);

    throwIfError(error);
}

async function replaceTaskAssignees(taskId, assigneeIds = []) {
    const uniqueAssigneeIds = [...new Set(assigneeIds.filter(Boolean))];
    const { error } = await supabase.rpc("set_task_assignees", {
        p_task_id: taskId,
        p_user_ids: uniqueAssigneeIds
    });

    throwIfError(error);
}