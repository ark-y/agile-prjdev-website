import { useEffect, useRef, useState } from "react";
import Icon from "../../components/Icons/Icons";
import WorkspaceShell from "../../components/WorkspaceShell/WorkspaceShell";
import { useNotifications } from "../../hooks/useNotifications";
import { formatDayMonth, formatProjectDates, projectDateRange } from "../../utils/projectDates";
import "./ProjectOverview.css";

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

function getMemberName(member) {
    return member.user_pref_name
        || `${member.user_first_name || ""} ${member.user_last_name || ""}`.trim()
        || member.user_email;
}

// Initials for the task card: first + last name letters, e.g. "Jane Doe" -> "JD".
function getMemberInitials(member) {
    const first = (member.user_first_name || "").trim();
    const last = (member.user_last_name || "").trim();

    if (first || last) {
        return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    }

    const words = getMemberName(member).trim().split(/\s+/).filter(Boolean);
    const letters = words.length > 1
        ? `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`
        : words[0]?.slice(0, 2) || "?";

    return letters.toUpperCase();
}

/*
 * The project page for Admins and Developers: a Backlog column, one column per
 * sprint, and a progress panel. Admins can also drag tasks between columns,
 * edit and delete sprints, add tasks and sprints, and manage tags.
 *
 * Developers see every task in the project and can filter the board by one or
 * more assignees to see what those people are working on. They can open any task, but tasks that
 * are not assigned to them open read-only.
 */
function ProjectOverview({
    profile,
    project,
    tasks = [],
    sprints = [],
    statuses = [],
    projectTags = [],
    tagsByTask = {},
    assigneesByTask = {},
    members = [],
    roleName,
    onAddTask,
    onEditTask,
    onAddSprint,
    onUpdateSprint,
    onDeleteSprint,
    onMoveTaskToSprint,
    onAddTag,
    onDeleteTag,
    onBack,
    onOpenSettings,
    onSignOut
}) {
    const notifications = useNotifications();
    const [editingSprintId, setEditingSprintId] = useState(null);
    const [sprintNameDrafts, setSprintNameDrafts] = useState({});
    const [newTagName, setNewTagName] = useState("");
    const [tagError, setTagError] = useState("");
    const [draggedTaskId, setDraggedTaskId] = useState(null);
    const [dragOverLaneId, setDragOverLaneId] = useState(null);
    // Empty shows every task; otherwise only tasks assigned to any of these user ids.
    const [filterUserIds, setFilterUserIds] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef(null);

    // Close the assignee dropdown on Escape or a click outside it.
    useEffect(() => {
        if (!isFilterOpen) {
            return undefined;
        }

        function handlePointerDown(event) {
            if (!filterRef.current?.contains(event.target)) {
                setIsFilterOpen(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setIsFilterOpen(false);
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isFilterOpen]);

    const isAdmin = roleName === "Admin";
    const isDeveloper = roleName === "Developer";

    // Is the signed-in user one of this task's assignees?
    const isMine = (task) =>
        (assigneesByTask[String(task.task_id)] || []).some(
            (userId) => String(userId) === String(profile?.user_id)
        );

    const isAssignedTo = (task, userId) =>
        (assigneesByTask[String(task.task_id)] || []).some(
            (assigneeId) => String(assigneeId) === String(userId)
        );

    // The developers on this project, with the signed-in user first.
    const filterDevelopers = members
        .filter((member) => member.role?.role_name === "Developer")
        .sort((a, b) => {
            const aIsMe = String(a.user_id) === String(profile?.user_id);
            const bIsMe = String(b.user_id) === String(profile?.user_id);
            if (aIsMe !== bIsMe) {
                return aIsMe ? -1 : 1;
            }
            return getMemberName(a).localeCompare(getMemberName(b));
        });

    const isFilterSelected = (userId) =>
        filterUserIds.some((selectedId) => String(selectedId) === String(userId));

    function toggleFilterUser(userId) {
        setFilterUserIds((current) =>
            current.some((selectedId) => String(selectedId) === String(userId))
                ? current.filter((selectedId) => String(selectedId) !== String(userId))
                : [...current, userId]
        );
    }

    const selectedDevelopers = filterDevelopers.filter((member) => isFilterSelected(member.user_id));
    const filterLabel = selectedDevelopers.length === 0
        ? "All tasks"
        : selectedDevelopers.length === 1
            ? `${getMemberName(selectedDevelopers[0])}${
                String(selectedDevelopers[0].user_id) === String(profile?.user_id) ? " (you)" : ""
            }`
            : `${getMemberName(selectedDevelopers[0])} +${selectedDevelopers.length - 1}`;

    // The tasks shown on the board. Only developers get the assignee filter.
    const activeFilterUserIds = isDeveloper ? selectedDevelopers.map((member) => member.user_id) : [];
    const hasActiveFilter = activeFilterUserIds.length > 0;
    const visibleTasks = hasActiveFilter
        ? tasks.filter((task) => activeFilterUserIds.some((userId) => isAssignedTo(task, userId)))
        : tasks;

    // The people assigned to a task, for the initials on the task card.
    const assigneeMembers = (task) =>
        (assigneesByTask[String(task.task_id)] || [])
            .map((userId) => members.find((member) => String(member.user_id) === String(userId)))
            .filter(Boolean);

    // Names such as Done, Complete and Completed all count as complete.
    const completedStatusIds = new Set(
        statuses
            .filter((status) => /\b(done|complete|completed)\b/i.test(status.status_name))
            .map((status) => String(status.status_id))
    );
    const isTaskComplete = (task) => completedStatusIds.has(String(task.task_status_id));

    const completedTasks = tasks.filter(isTaskComplete).length;
    const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const client = members.find((member) => member.role?.role_name === "Client");
    const dateRange = projectDateRange(sprints);
    const facts = [
        ["Team list", `${members.length} ${members.length === 1 ? "member" : "members"}`],
        ["Project timeline", formatProjectDates(dateRange)],
        ["Project due date", dateRange.end ? formatDayMonth(dateRange.end) : "Not set"],
        ["Client", client ? getMemberName(client) : "Not assigned"]
    ];

    // ---- drag and drop: only admins can move tasks between columns ----
    function handleDragStart(event, taskId) {
        setDraggedTaskId(taskId);
        event.dataTransfer.setData("text/plain", String(taskId));
        event.dataTransfer.effectAllowed = "move";
    }

    function handleDragOver(event, laneId) {
        if (!isAdmin) {
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setDragOverLaneId(laneId);
    }

    function handleDragLeave(event) {
        if (event.currentTarget.contains(event.relatedTarget)) {
            return;
        }
        setDragOverLaneId(null);
    }

    function handleDrop(event, sprintId) {
        event.preventDefault();
        event.stopPropagation();

        if (!isAdmin) {
            return;
        }

        const transferred = event.dataTransfer.getData("text/plain");
        const taskId = draggedTaskId ?? (transferred ? Number(transferred) : null);

        if (taskId !== null) {
            const task = tasks.find((item) => item.task_id === taskId);
            const nextSprintId = sprintId ?? null;

            if (task && task.sprint_id !== nextSprintId) {
                onMoveTaskToSprint(taskId, nextSprintId);
            }
        }

        setDraggedTaskId(null);
        setDragOverLaneId(null);
    }

    // ---- sprint name editing ----
    function handleSprintNameBlur(sprint) {
        const draftName = sprintNameDrafts[sprint.sprint_id];

        if (draftName !== undefined && draftName !== sprint.sprint_name) {
            onUpdateSprint(sprint.sprint_id, { name: draftName });
        }

        setSprintNameDrafts((drafts) => {
            const nextDrafts = { ...drafts };
            delete nextDrafts[sprint.sprint_id];
            return nextDrafts;
        });
    }

    async function handleAddTag(event) {
        event.preventDefault();
        setTagError("");

        try {
            await onAddTag(newTagName);
            setNewTagName("");
        } catch (error) {
            setTagError(error.message || "Could not add the tag.");
        }
    }

    // A task card opens the full task view; it has no status or delete controls.
    function renderTask(task) {
        const statusName = task.task_status?.status_name || "No status";
        const taskTags = tagsByTask[String(task.task_id)] || [];
        const mine = isMine(task);
        const assignees = isDeveloper ? assigneeMembers(task) : [];
        const shownAssignees = assignees.slice(0, 3);
        const hiddenAssignees = assignees.slice(3);
        const classes = [
            "po-task",
            isDeveloper && !mine ? "po-task-others" : "",
            isTaskComplete(task) ? "po-task-complete" : "",
            draggedTaskId === task.task_id ? "po-task-dragging" : ""
        ].filter(Boolean).join(" ");

        return (
            <div
                key={task.task_id}
                className={classes}
                draggable={isAdmin}
                role="button"
                tabIndex={0}
                onClick={() => onEditTask(task)}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onEditTask(task);
                    }
                }}
                onDragStart={(event) => handleDragStart(event, task.task_id)}
                onDragEnd={() => {
                    setDraggedTaskId(null);
                    setDragOverLaneId(null);
                }}
            >
                <div className="po-task-top">
                    <span
                        className="po-task-status"
                        title={statusName}
                        aria-label={statusName}
                        style={{ backgroundColor: task.task_status?.status_color || undefined }}
                    />
                    <span className="po-task-name">{task.task_name}</span>
                    <span className="po-task-info">
                        {task.task_priority && (
                            <span className="po-task-priority" title={`${task.task_priority} priority`}>
                                {getPrioritySymbol(task.task_priority)}
                            </span>
                        )}
                        {task.task_weight != null && (
                            <span className="po-task-weight" title="Task weight">{task.task_weight}</span>
                        )}
                    </span>
                </div>

                {(taskTags.length > 0 || isDeveloper) && (
                    <div className="po-task-meta">
                        <div className="po-task-tags" aria-label="Task tags">
                            {taskTags.map((tagId) => {
                                const tag = projectTags.find((item) => String(item.tag_id) === tagId);
                                return tag ? (
                                    <span key={tagId} style={{ backgroundColor: tag.tag_colour || undefined }}>
                                        {tag.tag_name}
                                    </span>
                                ) : null;
                            })}
                        </div>

                        {isDeveloper && (
                            <div className="po-task-people" aria-label="Assigned to">
                                {shownAssignees.map((member) => (
                                    <span
                                        key={member.user_id}
                                        className={`po-initials${
                                            String(member.user_id) === String(profile?.user_id) ? " is-me" : ""
                                        }`}
                                        title={getMemberName(member)}
                                        aria-label={getMemberName(member)}
                                    >
                                        {getMemberInitials(member)}
                                    </span>
                                ))}
                                {hiddenAssignees.length > 0 && (
                                    <span
                                        className="po-initials"
                                        title={hiddenAssignees.map(getMemberName).join(", ")}
                                        aria-label={hiddenAssignees.map(getMemberName).join(", ")}
                                    >
                                        +{hiddenAssignees.length}
                                    </span>
                                )}
                                {assignees.length === 0 && (
                                    <span className="po-initials is-empty" title="Unassigned" aria-label="Unassigned">
                                        &ndash;
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    function renderTasks(sprintId) {
        const laneTasks = visibleTasks.filter((task) =>
            sprintId === null
                ? task.sprint_id === null || task.sprint_id === undefined
                : task.sprint_id === sprintId
        );

        return (
            <div className="po-lane-tasks">
                {laneTasks.map(renderTask)}
                {laneTasks.length === 0 && (
                    <p className="po-lane-empty">
                        {isAdmin
                            ? "Drop tasks here"
                            : hasActiveFilter ? "No matching tasks" : "No tasks"}
                    </p>
                )}
            </div>
        );
    }

    function laneHandlers(sprintId) {
        const laneId = sprintId ?? "backlog";
        return {
            onDragOver: (event) => handleDragOver(event, laneId),
            onDragLeave: handleDragLeave,
            onDrop: (event) => handleDrop(event, sprintId)
        };
    }

    function renderSprint(sprint) {
        const name = sprintNameDrafts[sprint.sprint_id] ?? sprint.sprint_name;
        const sprintTasks = tasks.filter((task) => task.sprint_id === sprint.sprint_id);

        // A sprint is complete once its end date has passed or every task in it is done.
        const sprintEnded = sprint.sprint_end_date
            && new Date(`${sprint.sprint_end_date.slice(0, 10)}T23:59:59`) < new Date();
        const allTasksComplete = sprintTasks.length > 0 && sprintTasks.every(isTaskComplete);
        const sprintComplete = sprintEnded || allTasksComplete;

        const sprintWeight = sprintTasks.reduce((total, task) => total + (Number(task.task_weight) || 0), 0);
        const isEditingDates = isAdmin && editingSprintId === sprint.sprint_id;
        const laneClasses = [
            "po-lane",
            sprintComplete ? "po-lane-complete" : "",
            dragOverLaneId === sprint.sprint_id ? "po-lane-drag-over" : ""
        ].filter(Boolean).join(" ");

        return (
            <section className={laneClasses} key={sprint.sprint_id} {...laneHandlers(sprint.sprint_id)}>
                <header className="po-lane-header">
                    {isAdmin ? (
                        <input
                            className="po-lane-name"
                            type="text"
                            aria-label="Sprint name"
                            value={name}
                            onChange={(event) =>
                                setSprintNameDrafts((drafts) => ({ ...drafts, [sprint.sprint_id]: event.target.value }))
                            }
                            onBlur={() => handleSprintNameBlur(sprint)}
                        />
                    ) : (
                        <h2>{sprint.sprint_name}</h2>
                    )}

                    {sprintWeight > 0 && (
                        <span className="po-badge" title="Total task weight">{sprintWeight}</span>
                    )}
                </header>

                <div className="po-lane-sub">
                {isEditingDates ? (
                    <div className="po-dates-editor">
                        <input
                            type="date"
                            aria-label="Sprint start date"
                            value={sprint.sprint_start_date?.slice(0, 10) || ""}
                            onChange={(event) => {
                                const startDate = event.target.value || null;
                                const endDate = sprint.sprint_end_date?.slice(0, 10);

                                onUpdateSprint(sprint.sprint_id, {
                                    startDate,
                                    ...(startDate && endDate && endDate < startDate ? { endDate: null } : {})
                                });
                            }}
                        />
                        <span aria-hidden="true">&ndash;</span>
                        <input
                            type="date"
                            aria-label="Sprint end date"
                            value={sprint.sprint_end_date?.slice(0, 10) || ""}
                            min={sprint.sprint_start_date?.slice(0, 10) || undefined}
                            onChange={(event) => onUpdateSprint(sprint.sprint_id, { endDate: event.target.value || null })}
                        />
                        <button type="button" className="po-dates-done" aria-label="Done editing dates" onClick={() => setEditingSprintId(null)}>
                            &#10003;
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="po-dates"
                        onClick={() => isAdmin && setEditingSprintId(sprint.sprint_id)}
                    >
                        {formatDayMonth(sprint.sprint_start_date)} &ndash; {formatDayMonth(sprint.sprint_end_date)}
                    </button>
                )}

                {isAdmin && !isEditingDates && (
                    <button
                        type="button"
                        className="po-lane-delete"
                        aria-label={`Delete ${name}`}
                        onClick={() => onDeleteSprint(sprint)}
                    >
                        <Icon name="trash" size={14} />
                    </button>
                )}
                </div>

                {renderTasks(sprint.sprint_id)}
            </section>
        );
    }

    return (
        <WorkspaceShell
            profile={profile}
            notifications={notifications}
            breadcrumb={[
                { label: "Workspace" },
                { label: "Projects", onClick: onBack },
                { label: project?.project_name || "Project" }
            ]}
            onOpenProjects={onBack}
            onOpenSettings={onOpenSettings}
            onSignOut={onSignOut}
        >
            <section className="po-head">
                <h1>{project?.project_name || "Project"}</h1>
                <p>Project overview, backlog, sprint, and progress</p>

                {isDeveloper && (
                    <div className="po-filter" ref={filterRef}>
                        <label className="po-filter-label" htmlFor="po-filter-button">Filter</label>

                        <div className="po-filter-anchor">
                            <button
                                type="button"
                                id="po-filter-button"
                                className="po-filter-button"
                                aria-haspopup="listbox"
                                aria-expanded={isFilterOpen}
                                onClick={() => setIsFilterOpen((open) => !open)}
                            >
                                <span>{filterLabel}</span>
                                <Icon name="chevronDown" size={16} />
                            </button>

                            {isFilterOpen && (
                                <div className="po-filter-menu" role="listbox" aria-multiselectable="true" aria-label="Filter tasks by assignee">
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={!hasActiveFilter}
                                        className={`po-filter-item${!hasActiveFilter ? " is-selected" : ""}`}
                                        onClick={() => setFilterUserIds([])}
                                    >
                                        <span className="po-filter-check" aria-hidden="true">
                                            {!hasActiveFilter && <Icon name="check" size={13} />}
                                        </span>
                                        <span className="po-filter-name">
                                            <strong>All tasks</strong>
                                        </span>
                                        <span className="po-filter-count">{tasks.length}</span>
                                    </button>

                                    {filterDevelopers.map((member) => {
                                        const isSelected = isFilterSelected(member.user_id);
                                        const isMe = String(member.user_id) === String(profile?.user_id);
                                        const count = tasks.filter((task) => isAssignedTo(task, member.user_id)).length;

                                        return (
                                            <button
                                                key={member.user_id}
                                                type="button"
                                                role="option"
                                                aria-selected={isSelected}
                                                className={`po-filter-item${isSelected ? " is-selected" : ""}`}
                                                onClick={() => toggleFilterUser(member.user_id)}
                                            >
                                                <span className="po-filter-check" aria-hidden="true">
                                                    {isSelected && <Icon name="check" size={13} />}
                                                </span>
                                                <span className="po-filter-name">
                                                    <strong>{getMemberName(member)}{isMe ? " (you)" : ""}</strong>
                                                    {member.user_email && <small>{member.user_email}</small>}
                                                </span>
                                                <span className="po-filter-count">{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>

            <div className="po-board">
                <div className="po-lanes">
                    <section
                        className={`po-lane${dragOverLaneId === "backlog" ? " po-lane-drag-over" : ""}`}
                        {...laneHandlers(null)}
                    >
                        <header className="po-lane-header">
                            <h2>Backlog</h2>
                        </header>
                        {renderTasks(null)}
                    </section>

                    {sprints.map(renderSprint)}
                </div>

                <aside className="po-side">
                    <section className="po-progress" aria-label="Progress">
                        <header>
                            <h2>Progress</h2>
                            <span className="po-percent">{progress}%</span>
                        </header>

                        <div
                            className="po-track"
                            role="progressbar"
                            aria-label="Completed tasks"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progress}
                        >
                            <span className="po-fill" style={{ width: `${progress}%` }} />
                        </div>

                        <p className="po-count">{completedTasks} of {tasks.length} tasks complete</p>

                        <ul className="po-facts">
                            {facts.map(([label, value]) => (
                                <li key={label}>
                                    <span>{label}</span>
                                    <strong>{value}</strong>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {isAdmin && (
                        <div className="po-actions">
                            <button type="button" className="po-action" onClick={onAddTask}>
                                <Icon name="plus" size={18} />
                                Add task
                            </button>
                            <button type="button" className="po-action" onClick={onAddSprint}>
                                <Icon name="plus" size={18} />
                                Add sprint
                            </button>
                        </div>
                    )}

                    {isAdmin && (
                        <section className="po-tags" aria-label="Project tags">
                            <h2>Project tags</h2>

                            <div className="po-tag-list">
                                {projectTags.map((tag) => (
                                    <span className="po-tag" key={tag.tag_id} style={{ borderColor: tag.tag_colour || undefined }}>
                                        {tag.tag_name}
                                        <button
                                            type="button"
                                            aria-label={`Delete ${tag.tag_name} tag`}
                                            onClick={() => onDeleteTag(tag.tag_id)}
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                                {!projectTags.length && <span className="po-tags-empty">No tags yet.</span>}
                            </div>

                            <form className="po-tag-form" onSubmit={handleAddTag}>
                                <label>
                                    New tag
                                    <input
                                        value={newTagName}
                                        onChange={(event) => setNewTagName(event.target.value)}
                                        maxLength={40}
                                    />
                                </label>
                                <button type="submit" disabled={!newTagName.trim()}>Add tag</button>
                            </form>

                            {tagError && <p className="po-tag-error" role="alert">{tagError}</p>}
                        </section>
                    )}
                </aside>
            </div>
        </WorkspaceShell>
    );
}

export default ProjectOverview;
