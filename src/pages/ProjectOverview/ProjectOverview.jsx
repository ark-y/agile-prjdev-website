import { useState } from "react";
import "./ProjectOverview.css";

function formatDate(date) {
    if (!date) {
        return "--/--";
    }

    const [year, month, day] = date.slice(0, 10).split("-");
    return `${day}/${month}`;
}

function getPrioritySymbol(priority) {
    if (priority === "high") {
        return "⌃";
    }
    if (priority === "medium") {
        return "-";
    }
    if (priority === "low") {
        return "⌄";
    }
    return "";
}

function ProjectOverview({
    project,
    tasks = [],
    sprints = [],
    statuses = [],
    members = [],
    memberCandidates = [],
    roleName,
    onAddTask,
    onEditTask,
    onDeleteTask,
    onAddSprint,
    onUpdateSprint,
    onDeleteSprint,
    onChangeTaskStatus,
    onAddMember,
    onRemoveMember,
    onBack,
    onRenameProject,
    onDeleteProject
}) {
    const [editingSprintId, setEditingSprintId] = useState(null);
    const [sprintNameDrafts, setSprintNameDrafts] = useState({});
    const [selectedCandidateId, setSelectedCandidateId] = useState("");
    const isAdmin = roleName === "Admin";
    const isDeveloper = roleName === "Developer";

    function renderTask(task) {
        const statusName = task.task_status?.status_name || "No status";

        return (
            <section className="task-card" key={task.task_id}>
                <span
                    className="task-status-circle"
                    title={statusName}
                    aria-label={statusName}
                    style={{
                        backgroundColor: task.task_status?.status_color || undefined
                    }}
                />

                {isAdmin ? (
                    <button
                        type="button"
                        className="task-card-name"
                        onClick={() => onEditTask(task)}
                    >
                        {task.task_name}
                    </button>
                ) : (
                    <span className="task-card-name">{task.task_name}</span>
                )}

                <section className="task-card-info">
                    {task.task_priority && (
                        <span className="task-priority">
                            {getPrioritySymbol(task.task_priority)}
                        </span>
                    )}
                    {task.task_weight !== null && (
                        <span className="task-card-weight">
                            {task.task_weight}
                        </span>
                    )}
                    {isDeveloper ? (
                        <select
                            aria-label={`Change status for ${task.task_name}`}
                            value={task.task_status_id || ""}
                            onChange={(event) => onChangeTaskStatus(
                                task.task_id,
                                event.target.value
                            )}
                        >
                            <option value="">No status</option>
                            {statuses.map((status) => (
                                <option key={status.status_id} value={status.status_id}>
                                    {status.status_name}
                                </option>
                            ))}
                        </select>
                    ) : isAdmin ? (
                        <button
                            type="button"
                            className="task-delete-button"
                            aria-label={`Delete ${task.task_name}`}
                            onClick={() => onDeleteTask(task)}
                        >
                            ×
                        </button>
                    ) : null}
                </section>
            </section>
        );
    }

    return (
        <main className="project-page">
            <header className="project-header">
                <h1>{project?.project_name || "Project"}</h1>
                <section className="project-header-icons">
                    <button type="button" className="message-button" aria-label="Notifications">
                        📥
                    </button>
                    {isAdmin && <button
                        type="button"
                        className="settings-button"
                        aria-label="Rename project"
                        onClick={onRenameProject}
                    >
                        ⚙
                    </button>}
                </section>
            </header>

            <section className="project-body">
                <section className="sprint-area">
                    <section className="sprint-box">
                        <h2>BACKLOG</h2>
                        <section className="task-area">
                            <p>Tasks belong to a sprint.</p>
                        </section>
                    </section>

                    {sprints.map((sprint) => {
                        const name = sprintNameDrafts[sprint.sprint_id] ?? sprint.sprint_name;

                        return (
                            <section className="sprint-box" key={sprint.sprint_id}>
                                {isAdmin && <button
                                    type="button"
                                    className="delete-sprint-button"
                                    aria-label={`Delete ${name}`}
                                    onClick={() => onDeleteSprint(sprint)}
                                >
                                    ×
                                </button>}

                                {isAdmin ? <input
                                    className="sprint-name-input"
                                    type="text"
                                    value={name}
                                    onChange={(event) => setSprintNameDrafts((drafts) => ({
                                        ...drafts,
                                        [sprint.sprint_id]: event.target.value
                                    }))}
                                    onBlur={() => {
                                        const draftName = sprintNameDrafts[sprint.sprint_id];
                                        if (draftName !== undefined && draftName !== sprint.sprint_name) {
                                            onUpdateSprint(sprint.sprint_id, { name: draftName });
                                        }
                                        setSprintNameDrafts((drafts) => {
                                            const nextDrafts = { ...drafts };
                                            delete nextDrafts[sprint.sprint_id];
                                            return nextDrafts;
                                        });
                                    }}
                                    aria-label="Sprint name"
                                /> : <h2>{sprint.sprint_name}</h2>}

                                <section className="sprint-dates">
                                    {!isAdmin || editingSprintId !== sprint.sprint_id ? (
                                        <button
                                            type="button"
                                            className="sprint-date-display"
                                            onClick={() => isAdmin && setEditingSprintId(sprint.sprint_id)}
                                        >
                                            {formatDate(sprint.sprint_start_date)}
                                            {" - "}
                                            {formatDate(sprint.sprint_end_date)}
                                        </button>
                                    ) : (
                                        <section className="sprint-date-editor">
                                            <input
                                                type="date"
                                                value={sprint.sprint_start_date?.slice(0, 10) || ""}
                                                onChange={(event) => {
                                                    const startDate = event.target.value || null;
                                                    const endDate = sprint.sprint_end_date?.slice(0, 10);
                                                    onUpdateSprint(sprint.sprint_id, {
                                                        startDate,
                                                        ...(startDate && endDate && endDate < startDate
                                                            ? { endDate: null }
                                                            : {})
                                                    });
                                                }}
                                            />
                                            <span>-</span>
                                            <input
                                                type="date"
                                                value={sprint.sprint_end_date?.slice(0, 10) || ""}
                                                min={sprint.sprint_start_date?.slice(0, 10) || undefined}
                                                onChange={(event) => onUpdateSprint(sprint.sprint_id, {
                                                    endDate: event.target.value || null
                                                })}
                                            />
                                            <button
                                                type="button"
                                                className="date-done-button"
                                                onClick={() => setEditingSprintId(null)}
                                            >
                                                ✓
                                            </button>
                                        </section>
                                    )}
                                </section>

                                <section className="task-area">
                                    {tasks
                                        .filter((task) => task.sprint_id === sprint.sprint_id)
                                        .map(renderTask)}
                                </section>
                            </section>
                        );
                    })}
                </section>

                <section className="sidebar-fade" />

                <aside className="project-sidebar">
                    <section className="progress-box">
                        <h2>PROGRESS</h2>
                        <section className="progress-row">
                            <section className="progress-bar">
                                <span className="progress-fill" />
                            </section>
                            <span className="progress-number">46%</span>
                        </section>
                        <section className="progress-info">
                            <p>Team list</p>
                            <p>Project timeline</p>
                            <p>Project due date</p>
                            <p>Client</p>
                        </section>
                    </section>

                    {isAdmin && <section className="sidebar-buttons">
                        <button type="button" className="sidebar-button" onClick={onAddTask}>
                            <span>ADD</span>
                            <span className="sidebar-plus">+</span>
                            <span>TASK</span>
                        </button>
                        <button type="button" className="sidebar-button" onClick={onAddSprint}>
                            <span>ADD</span>
                            <span className="sidebar-plus">+</span>
                            <span>SPRINT</span>
                        </button>
                        <button
                            type="button"
                            className="sidebar-button delete-project-button"
                            onClick={onDeleteProject}
                        >
                            DELETE PROJECT
                        </button>
                    </section>}

                    {isAdmin && (
                        <section className="project-members">
                            <h2>PROJECT MEMBERS</h2>
                            {members.map((member) => (
                                <p key={member.user_id}>
                                    {member.user_pref_name
                                        || `${member.user_first_name} ${member.user_last_name}`}
                                    {member.user_id !== project.project_created_by && (
                                        <button
                                            type="button"
                                            onClick={() => onRemoveMember(member)}
                                            aria-label={`Remove ${member.user_first_name} from project`}
                                        >
                                            ×
                                        </button>
                                    )}
                                </p>
                            ))}
                            {memberCandidates.length > 0 && (
                                <section>
                                    <select
                                        aria-label="Choose a developer or client to add"
                                        value={selectedCandidateId}
                                        onChange={(event) => setSelectedCandidateId(event.target.value)}
                                    >
                                        <option value="">Add a member...</option>
                                        {memberCandidates.map((member) => (
                                            <option key={member.user_id} value={member.user_id}>
                                                {member.user_pref_name
                                                    || `${member.user_first_name} ${member.user_last_name}`}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        disabled={!selectedCandidateId}
                                        onClick={async () => {
                                            if (await onAddMember(selectedCandidateId)) {
                                                setSelectedCandidateId("");
                                            }
                                        }}
                                    >
                                        Add member
                                    </button>
                                </section>
                            )}
                        </section>
                    )}
                </aside>
            </section>

            <button
                type="button"
                className="back-projects-button"
                onClick={onBack}
            >
                ← Back to Projects
            </button>
        </main>
    );
}

export default ProjectOverview;
