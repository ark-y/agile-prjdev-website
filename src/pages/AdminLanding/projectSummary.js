/*
 * Turns raw sprint / task / member rows into the numbers each project card
 * shows. "Complete" and "sprint complete" follow the same rules as
 * ProjectOverview so a project reads the same on the landing and inside.
 */

const COMPLETE_STATUS = /\b(done|complete|completed)\b/i;

export const STATUS_PLANNING = "Planning";
export const STATUS_IN_PROGRESS = "In progress";
export const STATUS_COMPLETED = "Completed";

function dayStart(dateString) {
    return new Date(`${dateString.slice(0, 10)}T00:00:00`);
}

function dayEnd(dateString) {
    return new Date(`${dateString.slice(0, 10)}T23:59:59`);
}

function isTaskComplete(task) {
    return COMPLETE_STATUS.test(task.task_status?.status_name || "");
}

function displayName(user) {
    return user.user_pref_name
        || `${user.user_first_name || ""} ${user.user_last_name || ""}`.trim();
}

function initialsOf(user) {
    const parts = displayName(user).split(/\s+/).filter(Boolean);
    if (!parts.length) {
        return "?";
    }
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function buildProjectSummaries({ projects, sprints, tasks, members, now = new Date() }) {
    const summaries = {};

    for (const project of projects) {
        const projectSprints = sprints.filter((sprint) => sprint.project_id === project.project_id);
        const projectTasks = tasks.filter((task) => task.project_id === project.project_id);

        const sprintState = projectSprints.map((sprint) => {
            const sprintTasks = projectTasks.filter((task) => task.sprint_id === sprint.sprint_id);
            const ended = Boolean(sprint.sprint_end_date) && dayEnd(sprint.sprint_end_date) < now;
            const allComplete = sprintTasks.length > 0 && sprintTasks.every(isTaskComplete);
            return {
                sprint,
                tasks: sprintTasks,
                ended,
                complete: ended || allComplete,
                hasOpenTasks: sprintTasks.some((task) => !isTaskComplete(task)),
                notStarted: Boolean(sprint.sprint_start_date) && dayStart(sprint.sprint_start_date) > now
            };
        });

        // The sprint the team is working in now: the first one not yet complete,
        // otherwise the most recent.
        const current = sprintState.find((state) => !state.complete)
            ?? sprintState[sprintState.length - 1]
            ?? null;

        const allTasksComplete = projectTasks.length > 0 && projectTasks.every(isTaskComplete);

        let status = STATUS_IN_PROGRESS;
        if (allTasksComplete) {
            status = STATUS_COMPLETED;
        } else if (!current || !projectTasks.length || current.notStarted) {
            status = STATUS_PLANNING;
        }

        // A sprint whose end date has passed with work still open.
        const overdue = sprintState.some((state) => state.ended && state.hasOpenTasks);

        const progressTasks = current ? current.tasks : projectTasks;
        const done = progressTasks.filter(isTaskComplete).length;

        const people = new Map();
        for (const { project_id: memberProjectId, user } of members) {
            if (memberProjectId === project.project_id && user && !people.has(user.user_id)) {
                people.set(user.user_id, user);
            }
        }
        const team = [...people.values()];
        const client = team.find((user) => user.role?.role_name === "Client");

        summaries[project.project_id] = {
            status,
            overdue,
            sprintName: current?.sprint.sprint_name ?? null,
            isActive: status === STATUS_IN_PROGRESS && Boolean(current) && !current.complete,
            progressLabel: current ? "Sprint progress" : "Task progress",
            done,
            total: progressTasks.length,
            percent: progressTasks.length ? Math.round((done / progressTasks.length) * 100) : 0,
            memberCount: team.length,
            avatars: team.slice(0, 3).map((user) => ({ id: user.user_id, initials: initialsOf(user) })),
            clientName: client ? displayName(client) : null
        };
    }

    return summaries;
}
