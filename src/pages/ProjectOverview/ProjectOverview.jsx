import { useState } from "react";
import TaskComments from "../../components/TaskComments/TaskComments";
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
    projectTags = [],
    tagsByTask = {},
    roleName,
    currentUserId,
    onAddTask,
    onEditTask,
    onDeleteTask,
    onAddSprint,
    onUpdateSprint,
    onDeleteSprint,
    onChangeTaskStatus,
    onMoveTaskToSprint,
    onAddTag,
    onDeleteTag,
    onBack,
    onOpenSettings
}) {
    const [editingSprintId, setEditingSprintId] = useState(null);
    const [sprintNameDrafts, setSprintNameDrafts] = useState({});
    const [newTagName, setNewTagName] = useState("");
    const [tagError, setTagError] = useState("");
    const [draggedTaskId, setDraggedTaskId] = useState(null);
    const [dragOverSprintId, setDragOverSprintId] = useState(null);

    const isAdmin = roleName === "Admin";
    const isDeveloper = roleName === "Developer";

    /*
     * Work out which statuses count as complete.
     *
     * This supports names such as:
     * Done
     * Complete
     * Completed
     */
    const completedStatusIds = new Set(
        statuses
            .filter((status) =>
                /\b(done|complete|completed)\b/i.test(status.status_name)
            )
            .map((status) => String(status.status_id))
    );

    /*
     * Project progress.
     */
    const completedTasks = tasks.filter((task) =>
        completedStatusIds.has(String(task.task_status_id))
    ).length;

    const progress = tasks.length
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0;

    /*
     * ============================
     * TASK DRAG AND DROP
     * ============================
     *
     * Only admins can drag tasks between sprints.
     */

    function handleDragStart(event, taskId) {
        setDraggedTaskId(taskId);

        event.dataTransfer.setData(
            "text/plain",
            String(taskId)
        );

        event.dataTransfer.effectAllowed = "move";
    }

    function handleDragOver(event, sprintId) {
        if (!isAdmin) {
            return;
        }

        event.preventDefault();

        event.dataTransfer.dropEffect = "move";

        setDragOverSprintId(
            sprintId ?? "backlog"
        );
    }

    function handleDragLeave(event) {
        if (
            event.currentTarget.contains(
                event.relatedTarget
            )
        ) {
            return;
        }

        setDragOverSprintId(null);
    }

    function handleDrop(event, sprintId) {
        event.preventDefault();
        event.stopPropagation();

        const transferredTaskId =
            event.dataTransfer.getData("text/plain");

        const taskId =
            draggedTaskId ??
            (
                transferredTaskId
                    ? Number(transferredTaskId)
                    : null
            );

        if (taskId !== null) {
            const task = tasks.find(
                (item) => item.task_id === taskId
            );

            const nextSprintId =
                sprintId ?? null;

            if (
                task &&
                task.sprint_id !== nextSprintId
            ) {
                onMoveTaskToSprint(
                    taskId,
                    nextSprintId
                );
            }
        }

        setDraggedTaskId(null);
        setDragOverSprintId(null);
    }

    /*
     * ============================
     * TASK CARD
     * ============================
     *
     * IMPORTANT:
     *
     * The task card itself DOES NOT
     * contain:
     *
     * - status dropdown
     * - workflow buttons
     * - delete button
     *
     * Clicking the card opens the
     * task details instead.
     */

    function renderTask(task) {
        const statusName =
            task.task_status?.status_name ||
            "No status";

        const taskTags =
            tagsByTask[String(task.task_id)] ||
            [];

        /*
         * Grey out completed tasks.
         */
        const isComplete =
            completedStatusIds.has(
                String(task.task_status_id)
            );

        return (
            <section
                className={
                    `task-card` +
                    (
                        isComplete
                            ? " task-card-complete"
                            : ""
                    ) +
                    (
                        draggedTaskId === task.task_id
                            ? " task-card-dragging"
                            : ""
                    )
                }
                key={task.task_id}

                /*
                 * Admins can drag tasks.
                 * Developers cannot.
                 */
                draggable={isAdmin}

                onDragStart={(event) =>
                    handleDragStart(
                        event,
                        task.task_id
                    )
                }

                onDragEnd={() => {
                    setDraggedTaskId(null);
                    setDragOverSprintId(null);
                }}

                /*
                 * Clicking a task opens
                 * the full task preview.
                 */
                onClick={() =>
                    onEditTask(task)
                }

                role="button"
                tabIndex={0}

                onKeyDown={(event) => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        onEditTask(task);
                    }
                }}
            >
                {/* STATUS INDICATOR */}

                <span
                    className="task-status-circle"
                    title={statusName}
                    aria-label={statusName}
                    style={{
                        backgroundColor:
                            task.task_status
                                ?.status_color ||
                            undefined
                    }}
                />

                {/* TASK NAME */}

                <span className="task-card-name">
                    {task.task_name}
                </span>

                {/* TASK TAGS */}

                {taskTags.length > 0 && (
                    <section
                        className="task-card-tags"
                        aria-label="Task tags"
                    >
                        {taskTags.map((tagId) => {
                            const tag =
                                projectTags.find(
                                    (item) =>
                                        String(
                                            item.tag_id
                                        ) === tagId
                                );

                            return tag ? (
                                <span
                                    key={tagId}
                                    style={{
                                        backgroundColor:
                                            tag.tag_colour ||
                                            "#3F9B76"
                                    }}
                                >
                                    {tag.tag_name}
                                </span>
                            ) : null;
                        })}
                    </section>
                )}

                {/* PRIORITY / WEIGHT */}

                <section className="task-card-info">
                    {task.task_priority && (
                        <span className="task-priority">
                            {getPrioritySymbol(
                                task.task_priority
                            )}
                        </span>
                    )}

                    {task.task_weight != null && (
                        <span className="task-card-weight">
                            {task.task_weight}
                        </span>
                    )}
                </section>
            </section>
        );
    }

    /*
     * ============================
     * TASK AREA
     * ============================
     */

    function renderTaskArea(sprintId) {
        const laneId =
            sprintId ?? "backlog";

        const laneTasks =
            tasks.filter((task) =>
                sprintId === null ||
                sprintId === undefined
                    ? task.sprint_id === null ||
                      task.sprint_id === undefined
                    : task.sprint_id ===
                      sprintId
            );

        return (
            <section
                className={
                    `task-area` +
                    (
                        dragOverSprintId ===
                        laneId
                            ? " task-area-drag-over"
                            : ""
                    )
                }

                onDragOver={(event) =>
                    handleDragOver(
                        event,
                        sprintId
                    )
                }

                onDragLeave={
                    handleDragLeave
                }

                onDrop={(event) =>
                    handleDrop(
                        event,
                        sprintId
                    )
                }
            >
                {laneTasks.map(renderTask)}

                {laneTasks.length === 0 && (
                    <p className="empty-sprint-message">
                        {isAdmin
                            ? "Drop tasks here"
                            : "No tasks"}
                    </p>
                )}
            </section>
        );
    }

    /*
     * ============================
     * SPRINT NAME EDITING
     * ============================
     */

    function handleSprintNameBlur(
        sprint
    ) {
        const draftName =
            sprintNameDrafts[
                sprint.sprint_id
            ];

        if (
            draftName !== undefined &&
            draftName !==
                sprint.sprint_name
        ) {
            onUpdateSprint(
                sprint.sprint_id,
                {
                    name: draftName
                }
            );
        }

        setSprintNameDrafts(
            (drafts) => {
                const nextDrafts = {
                    ...drafts
                };

                delete nextDrafts[
                    sprint.sprint_id
                ];

                return nextDrafts;
            }
        );
    }

    return (
        <main className="project-page">

            {/* =========================
                HEADER
            ========================== */}

            <header className="project-header">
                <h1>
                    {project?.project_name ||
                        "Project"}
                </h1>

                <section className="project-header-icons">
                    <button
                        type="button"
                        className="settings-button"
                        aria-label="Open settings"
                        onClick={onOpenSettings}
                    >
                        ⚙
                    </button>
                </section>
            </header>

            <section className="project-body">

                {/* =====================
                    SPRINTS
                ====================== */}

                <section className="sprint-area">

                    {/* BACKLOG */}

                    <section
                        className="sprint-box"

                        onDragOver={(event) =>
                            handleDragOver(
                                event,
                                null
                            )
                        }

                        onDragLeave={
                            handleDragLeave
                        }

                        onDrop={(event) =>
                            handleDrop(
                                event,
                                null
                            )
                        }
                    >
                        <h2>BACKLOG</h2>

                        {renderTaskArea(null)}
                    </section>

                    {/* SPRINT LIST */}

                    {sprints.map(
                        (sprint) => {

                            const name =
                                sprintNameDrafts[
                                    sprint
                                        .sprint_id
                                ] ??
                                sprint.sprint_name;

                            const sprintTasks =
                                tasks.filter(
                                    (task) =>
                                        task.sprint_id ===
                                        sprint.sprint_id
                                );

                            /*
                             * Sprint is complete when:
                             *
                             * 1. End date has passed
                             *
                             * OR
                             *
                             * 2. Every task is complete
                             */

                            const sprintEnded =
                                sprint.sprint_end_date &&
                                new Date(
                                    `${
                                        sprint
                                            .sprint_end_date
                                            .slice(
                                                0,
                                                10
                                            )
                                    }T23:59:59`
                                ) <
                                    new Date();

                            const allSprintTasksComplete =
                                sprintTasks.length >
                                    0 &&
                                sprintTasks.every(
                                    (task) =>
                                        completedStatusIds.has(
                                            String(
                                                task
                                                    .task_status_id
                                            )
                                        )
                                );

                            const sprintComplete =
                                sprintEnded ||
                                allSprintTasksComplete;

                            /*
                             * Total weight of tasks
                             * in this sprint.
                             */

                            const sprintWeight =
                                tasks
                                    .filter(
                                        (task) =>
                                            task.sprint_id ===
                                            sprint.sprint_id
                                    )
                                    .reduce(
                                        (
                                            total,
                                            task
                                        ) =>
                                            total +
                                            (
                                                Number(
                                                    task.task_weight
                                                ) ||
                                                0
                                            ),
                                        0
                                    );

                            return (
                                <section
                                    className={
                                        `sprint-box` +
                                        (
                                            sprintComplete
                                                ? " sprint-box-complete"
                                                : ""
                                        )
                                    }

                                    key={
                                        sprint.sprint_id
                                    }

                                    onDragOver={(
                                        event
                                    ) =>
                                        handleDragOver(
                                            event,
                                            sprint.sprint_id
                                        )
                                    }

                                    onDragLeave={
                                        handleDragLeave
                                    }

                                    onDrop={(
                                        event
                                    ) =>
                                        handleDrop(
                                            event,
                                            sprint.sprint_id
                                        )
                                    }
                                >

                                    {/* SPRINT WEIGHT */}

                                    {sprintWeight >
                                        0 && (
                                        <span
                                            className="sprint-weight-marker"
                                            title="Total task weight"
                                        >
                                            {
                                                sprintWeight
                                            }
                                        </span>
                                    )}

                                    {/* DELETE SPRINT
                                        ADMIN ONLY
                                    */}

                                    {isAdmin && (
                                        <button
                                            type="button"
                                            className="delete-sprint-button"
                                            aria-label={`Delete ${name}`}
                                            onClick={() =>
                                                onDeleteSprint(
                                                    sprint
                                                )
                                            }
                                        >
                                            ×
                                        </button>
                                    )}

                                    {/* SPRINT NAME */}

                                    {isAdmin ? (
                                        <input
                                            className="sprint-name-input"
                                            type="text"
                                            value={name}

                                            onChange={(
                                                event
                                            ) =>
                                                setSprintNameDrafts(
                                                    (
                                                        drafts
                                                    ) => ({
                                                        ...drafts,

                                                        [sprint.sprint_id]:
                                                            event
                                                                .target
                                                                .value
                                                    })
                                                )
                                            }

                                            onBlur={() =>
                                                handleSprintNameBlur(
                                                    sprint
                                                )
                                            }

                                            aria-label="Sprint name"
                                        />
                                    ) : (
                                        <h2>
                                            {
                                                sprint.sprint_name
                                            }
                                        </h2>
                                    )}

                                    {/* SPRINT DATES */}

                                    <section className="sprint-dates">

                                        {!isAdmin ||
                                        editingSprintId !==
                                            sprint.sprint_id ? (

                                            <button
                                                type="button"
                                                className="sprint-date-display"

                                                onClick={() =>
                                                    isAdmin &&
                                                    setEditingSprintId(
                                                        sprint.sprint_id
                                                    )
                                                }
                                            >
                                                {formatDate(
                                                    sprint.sprint_start_date
                                                )}

                                                {" - "}

                                                {formatDate(
                                                    sprint.sprint_end_date
                                                )}
                                            </button>

                                        ) : (

                                            <section className="sprint-date-editor">

                                                {/* START DATE */}

                                                <input
                                                    type="date"

                                                    value={
                                                        sprint.sprint_start_date?.slice(
                                                            0,
                                                            10
                                                        ) ||
                                                        ""
                                                    }

                                                    onChange={(
                                                        event
                                                    ) => {

                                                        const startDate =
                                                            event
                                                                .target
                                                                .value ||
                                                            null;

                                                        const endDate =
                                                            sprint.sprint_end_date?.slice(
                                                                0,
                                                                10
                                                            );

                                                        onUpdateSprint(
                                                            sprint.sprint_id,
                                                            {
                                                                startDate,

                                                                ...(startDate &&
                                                                endDate &&
                                                                endDate <
                                                                    startDate
                                                                    ? {
                                                                          endDate:
                                                                              null
                                                                      }
                                                                    : {})
                                                            }
                                                        );
                                                    }}
                                                />

                                                <span>
                                                    -
                                                </span>

                                                {/* END DATE */}

                                                <input
                                                    type="date"

                                                    value={
                                                        sprint.sprint_end_date?.slice(
                                                            0,
                                                            10
                                                        ) ||
                                                        ""
                                                    }

                                                    min={
                                                        sprint.sprint_start_date?.slice(
                                                            0,
                                                            10
                                                        ) ||
                                                        undefined
                                                    }

                                                    onChange={(
                                                        event
                                                    ) =>
                                                        onUpdateSprint(
                                                            sprint.sprint_id,
                                                            {
                                                                endDate:
                                                                    event
                                                                        .target
                                                                        .value ||
                                                                    null
                                                            }
                                                        )
                                                    }
                                                />

                                                <button
                                                    type="button"
                                                    className="date-done-button"

                                                    onClick={() =>
                                                        setEditingSprintId(
                                                            null
                                                        )
                                                    }
                                                >
                                                    ✓
                                                </button>
                                            </section>
                                        )}
                                    </section>

                                    {/* TASKS */}

                                    {renderTaskArea(
                                        sprint.sprint_id
                                    )}
                                </section>
                            );
                        }
                    )}
                </section>

                <section className="sidebar-fade" />

                {/* =====================
                    SIDEBAR
                ====================== */}

                <aside className="project-sidebar">

                    {/* PROGRESS */}

                    <section className="progress-box">
                        <h2>PROGRESS</h2>

                        <section className="progress-row">

                            <section
                                className="progress-bar"
                                role="progressbar"
                                aria-label="Completed tasks"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={
                                    progress
                                }
                            >
                                <span
                                    className="progress-fill"
                                    style={{
                                        width: `${progress}%`
                                    }}
                                />
                            </section>

                            <span className="progress-number">
                                {progress}%
                            </span>
                        </section>

                        <section className="progress-info">
                            <p>
                                {completedTasks} of{" "}
                                {tasks.length} tasks
                                complete
                            </p>

                            <p>
                                Project timeline
                            </p>

                            <p>
                                Project due date
                            </p>

                            <p>Client</p>
                        </section>
                    </section>

                    {/* ADMIN BUTTONS */}

                    {isAdmin && (
                        <section className="sidebar-buttons">

                            <button
                                type="button"
                                className="sidebar-button"
                                onClick={
                                    onAddTask
                                }
                            >
                                <span>
                                    ADD
                                </span>

                                <span className="sidebar-plus">
                                    +
                                </span>

                                <span>
                                    TASK
                                </span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-button"
                                onClick={
                                    onAddSprint
                                }
                            >
                                <span>
                                    ADD
                                </span>

                                <span className="sidebar-plus">
                                    +
                                </span>

                                <span>
                                    SPRINT
                                </span>
                            </button>
                        </section>
                    )}

                    {/* PROJECT TAGS */}

                    {isAdmin && (
                        <section className="project-tags">

                            <h2>
                                PROJECT TAGS
                            </h2>

                            {projectTags.map(
                                (tag) => (
                                    <p
                                        key={
                                            tag.tag_id
                                        }
                                    >
                                        <span
                                            style={{
                                                borderColor:
                                                    tag.tag_colour ||
                                                    "#3F9B76"
                                            }}
                                        >
                                            {
                                                tag.tag_name
                                            }
                                        </span>

                                        <button
                                            type="button"

                                            aria-label={`Delete ${tag.tag_name} tag`}

                                            onClick={() =>
                                                onDeleteTag(
                                                    tag.tag_id
                                                )
                                            }
                                        >
                                            ×
                                        </button>
                                    </p>
                                )
                            )}

                            {/* ADD TAG */}

                            <form
                                onSubmit={async (
                                    event
                                ) => {
                                    event.preventDefault();

                                    setTagError(
                                        ""
                                    );

                                    try {
                                        await onAddTag(
                                            newTagName
                                        );

                                        setNewTagName(
                                            ""
                                        );
                                    } catch (
                                        error
                                    ) {
                                        setTagError(
                                            error.message ||
                                                "Could not add the tag."
                                        );
                                    }
                                }}
                            >
                                <label>
                                    New tag

                                    <input
                                        value={
                                            newTagName
                                        }

                                        onChange={(
                                            event
                                        ) =>
                                            setNewTagName(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }

                                        maxLength={
                                            40
                                        }
                                    />
                                </label>

                                <button
                                    type="submit"
                                    disabled={
                                        !newTagName.trim()
                                    }
                                >
                                    Add tag
                                </button>
                            </form>

                            {tagError && (
                                <p role="alert">
                                    {tagError}
                                </p>
                            )}
                        </section>
                    )}
                </aside>
            </section>

            {/* BACK BUTTON */}

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