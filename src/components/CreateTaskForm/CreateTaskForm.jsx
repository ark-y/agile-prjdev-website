import { useEffect, useRef, useState } from "react";
import Icon from "../Icons/Icons";
import WorkspaceShell from "../WorkspaceShell/WorkspaceShell";
import "./CreateTaskForm.css";


const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const TAG_COLOURS = [
    "#3F9B76", "#963A91", "#3976B8", "#D18B2C", "#B94A48",
    "#5B8C5A", "#5967A8", "#B45F91", "#4A8F9C", "#777777"
];


// Close a popover on Escape or a click outside it.
function useDismiss(ref, isOpen, onDismiss) {

    useEffect(() => {

        if (!isOpen) {
            return undefined;
        }

        function handlePointerDown(event) {
            if (!ref.current?.contains(event.target)) {
                onDismiss();
            }
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onDismiss();
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };

    }, [isOpen]);

}


function getMemberName(member) {

    return member.user_pref_name ||
        `${member.user_first_name} ${member.user_last_name}`;

}


function CreateTaskForm({
    onSaveTask,
    onCancel,
    onDeleteTask,
    onOpenProjects,
    onOpenSettings,
    onSignOut,
    initialTask = null,
    sprints = [],
    statuses = [],
    projectTags = [],
    onAddTag,
    members = [],
    roleName = "",
    currentUser = null,
    readOnly = false
}) {

    // whether we are creating a new task or editing an existing task
    const isEditing = Boolean(initialTask?.task_id);

    // read-only: a developer viewing a task that is assigned to someone else
    const isReadOnly = isEditing && readOnly;

    // admins and developers can edit tasks (unless the card is read-only)
    const canEditTask =
        !isReadOnly &&
        (
            roleName === "Admin" ||
            roleName === "Developer"
        );

    // only admins can delete tasks
    const canDeleteTask =
        roleName === "Admin" &&
        !isReadOnly;


    // task name
    const [taskName, setTaskName] =
        useState(initialTask?.task_name || "");


    // task weight
    const [taskWeight, setTaskWeight] =
        useState(initialTask?.task_weight?.toString() || "");


    // task priority
    const [taskPriority, setTaskPriority] =
        useState(initialTask?.task_priority || "");


    // task description
    const [taskDescription, setTaskDescription] =
        useState(initialTask?.task_desc || "");


    // sprint
    const [sprintId] =
        useState(initialTask?.sprint_id?.toString() || "");


    // task status
    const [statusId, setStatusId] =
        useState(initialTask?.task_status_id?.toString() || "");


    // assignees
    const [assigneeIds, setAssigneeIds] =
        useState(initialTask?.assigneeIds || []);

    const canToggleChecklist =
        !isReadOnly &&
        (
        roleName === "Admin" ||
        (
            roleName === "Developer" &&
            currentUser?.user_id != null &&
            assigneeIds.some(
                (assigneeId) =>
                    String(assigneeId) === String(currentUser.user_id)
            )
        )
        );


    // tags
    const [tagIds, setTagIds] =
        useState(initialTask?.tagIds || []);


    // checklist
    const [checklists, setChecklists] =
        useState(
            Array.isArray(initialTask?.task_checklists)
                ? initialTask.task_checklists
                : []
        );


    // text currently being entered for a new checklist item
    const [newChecklistItem, setNewChecklistItem] =
        useState("");


    const [isTagPopupOpen, setIsTagPopupOpen] =
        useState(false);


    const [newTagName, setNewTagName] =
        useState("");


    const [newTagColour, setNewTagColour] =
        useState("#3F9B76");


    const [tagError, setTagError] =
        useState("");


    const [isAddingTag, setIsAddingTag] =
        useState(false);


    const [isSaving, setIsSaving] =
        useState(false);


    const [isDeleting, setIsDeleting] =
        useState(false);


    const [formError, setFormError] =
        useState("");


    // whether the assignee list is open
    const [isAssigneeOpen, setIsAssigneeOpen] =
        useState(false);


    // whether the deadline calendar is open
    const [isCalendarOpen, setIsCalendarOpen] =
        useState(false);


    // the date the user has picked, if any
    const [selectedDate, setSelectedDate] =
        useState(
            initialTask?.task_deadline
                ? new Date(
                    `${initialTask.task_deadline.slice(0, 10)}T00:00:00`
                )
                : null
        );


    // month/year currently shown in the calendar
    const today = new Date();


    const [viewYear, setViewYear] =
        useState(today.getFullYear());


    const [viewMonth, setViewMonth] =
        useState(today.getMonth());


    const calendarRef = useRef(null);
    const assigneeRef = useRef(null);
    const tagsRef = useRef(null);

    useDismiss(calendarRef, isCalendarOpen, () => setIsCalendarOpen(false));
    useDismiss(assigneeRef, isAssigneeOpen, () => setIsAssigneeOpen(false));
    useDismiss(tagsRef, isTagPopupOpen, () => setIsTagPopupOpen(false));


    // move calendar back one month
    function goToPreviousMonth() {

        if (viewMonth === 0) {

            setViewMonth(11);
            setViewYear(viewYear - 1);

        } else {

            setViewMonth(viewMonth - 1);

        }

    }


    // move calendar forward one month
    function goToNextMonth() {

        if (viewMonth === 11) {

            setViewMonth(0);
            setViewYear(viewYear + 1);

        } else {

            setViewMonth(viewMonth + 1);

        }

    }


    // user picked a deadline
    function handleSelectDay(day) {

        setSelectedDate(
            new Date(viewYear, viewMonth, day)
        );

        setIsCalendarOpen(false);

    }


    // text shown on deadline button
    const deadlineLabel = selectedDate
        ? `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
        : "Select deadline";


    // building calendar cells
    const firstWeekday =
        new Date(viewYear, viewMonth, 1).getDay();


    const daysInMonth =
        new Date(viewYear, viewMonth + 1, 0).getDate();


    const calendarCells = [];


    for (let i = 0; i < firstWeekday; i++) {

        calendarCells.push(null);

    }


    for (let day = 1; day <= daysInMonth; day++) {

        calendarCells.push(day);

    }


    // the developers chosen for this task, by name
    const isAssigned = (userId) =>
        assigneeIds.some(
            (assigneeId) =>
                String(assigneeId) === String(userId)
        );

    const assigneeLabel = members
        .filter((member) => isAssigned(member.user_id))
        .map(getMemberName)
        .join(", ");


    function toggleAssignee(userId) {

        setAssigneeIds((current) =>
            current.some(
                (assigneeId) =>
                    String(assigneeId) === String(userId)
            )
                ? current.filter(
                    (assigneeId) =>
                        String(assigneeId) !== String(userId)
                )
                : [...current, userId]
        );

    }


    async function handleAddTag() {

        if (!newTagName.trim()) {

            setTagError("Enter a name for the tag.");

            return;

        }


        setTagError("");
        setIsAddingTag(true);


        try {

            const tag =
                await onAddTag?.(
                    newTagName,
                    newTagColour
                );


            if (!tag?.tag_id) {

                throw new Error(
                    "Could not create the tag."
                );

            }


            const tagId =
                String(tag.tag_id);


            setTagIds((current) =>
                current.includes(tagId)
                    ? current
                    : [...current, tagId]
            );


            setNewTagName("");

            setIsTagPopupOpen(false);

        } catch (error) {

            setTagError(
                error.message ||
                "Could not create the tag."
            );

        } finally {

            setIsAddingTag(false);

        }

    }


    // add checklist item
    function handleAddChecklistItem() {

        const checklistText =
            newChecklistItem.trim();


        if (!checklistText) {

            return;

        }


        if (!canEditTask) {

            setFormError(
                "You do not have permission to add checklist items."
            );

            return;

        }


        const addedByName =
            currentUser?.user_pref_name ||
            [
                currentUser?.user_first_name,
                currentUser?.user_last_name
            ]
                .filter(Boolean)
                .join(" ") ||
            "Unknown user";


        const checklistItem = {

            id:
                typeof crypto !== "undefined" &&
                crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random()}`,

            text: checklistText,

            completed: false,

            addedBy: {
                userId: currentUser?.user_id || null,
                name: addedByName
            },

            addedAt: new Date().toISOString()

        };


        setChecklists((current) => [
            ...current,
            checklistItem
        ]);


        setNewChecklistItem("");

    }


    // allow enter key to add checklist item
    function handleChecklistKeyDown(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            handleAddChecklistItem();

        }

    }


    // mark checklist item complete / incomplete
    function handleToggleChecklistItem(itemId) {

        if (!canToggleChecklist) {

            return;

        }


        setChecklists((current) =>
            current.map((item) => {

                if (item.id !== itemId) {

                    return item;

                }


                return {
                    ...item,
                    completed: !item.completed
                };

            })
        );

    }


    // remove checklist item
    function handleRemoveChecklistItem(itemId) {

        if (isReadOnly) {

            return;

        }


        setChecklists((current) =>
            current.filter(
                (item) =>
                    item.id !== itemId
            )
        );

    }


    // saving task
    async function handleSaveTask() {

        if (isReadOnly) {

            return;

        }


        if (
            !taskName.trim() ||
            !taskWeight ||
            !taskPriority
        ) {

            setFormError(
                "Enter a name and choose a priority and weight."
            );

            return;

        }


        // editing an existing task is only allowed
        // for Admin and Developer
        if (isEditing && !canEditTask) {

            setFormError(
                "You do not have permission to edit this task."
            );

            return;

        }


        setIsSaving(true);

        setFormError("");


        try {

            await onSaveTask?.({

                taskId:
                    initialTask?.task_id,

                name:
                    taskName.trim(),

                description:
                    taskDescription,

                weight:
                    taskWeight,

                priority:
                    taskPriority,

                deadline:
                    selectedDate
                        ? [
                            selectedDate.getFullYear(),
                            String(
                                selectedDate.getMonth() + 1
                            ).padStart(2, "0"),
                            String(
                                selectedDate.getDate()
                            ).padStart(2, "0")
                        ].join("-")
                        : null,

                sprintId:
                    sprintId
                        ? Number(sprintId)
                        : null,

                statusId:
                    statusId
                        ? Number(statusId)
                        : null,

                assigneeIds,

                tagIds,

                checklists

            });

        } catch (error) {

            setFormError(
                error.message ||
                "Could not save the task."
            );

        } finally {

            setIsSaving(false);

        }

    }


    // deleting task
    async function handleDeleteTask() {

        // only admins are allowed to delete
        if (!isEditing || !canDeleteTask) {

            return;

        }


        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${taskName}"?`
            );


        if (!confirmed) {

            return;

        }


        setIsDeleting(true);

        setFormError("");


        try {

            await onDeleteTask?.(
                initialTask
            );

        } catch (error) {

            setFormError(
                error.message ||
                "Could not delete the task."
            );

        } finally {

            setIsDeleting(false);

        }

    }


    const isBusy = isSaving || isDeleting;

    const weightBadge = taskWeight || "–";

    const initial = (
        currentUser?.user_pref_name ||
        currentUser?.user_first_name ||
        "?"
    )[0].toUpperCase();


    /*
     * ==============================
     * FIELDS
     * ==============================
     */

    const deadlineField = (
        <div className="tf-field">
            <label htmlFor="task-deadline">Deadline</label>

            <div className="tf-anchor" ref={calendarRef}>

                <button
                    type="button"
                    id="task-deadline"
                    className="tf-input tf-dropdown"
                    aria-haspopup="dialog"
                    aria-expanded={isCalendarOpen}
                    disabled={isReadOnly}
                    onClick={() => {

                        setIsAssigneeOpen(false);

                        setIsCalendarOpen(!isCalendarOpen);

                    }}
                >
                    <span className={selectedDate ? "" : "is-placeholder"}>
                        {deadlineLabel}
                    </span>
                    <Icon name="chevronDown" size={16} />
                </button>

                {/* calendar popup */}
                {isCalendarOpen && (

                    <div className="tf-calendar" role="dialog" aria-label="Choose a deadline">

                        <div className="tf-calendar-header">

                            <button
                                type="button"
                                className="tf-calendar-nav"
                                aria-label="Previous month"
                                onClick={goToPreviousMonth}
                            >
                                ‹
                            </button>

                            <span className="tf-calendar-month">
                                {MONTH_NAMES[viewMonth]} {viewYear}
                            </span>

                            <button
                                type="button"
                                className="tf-calendar-nav"
                                aria-label="Next month"
                                onClick={goToNextMonth}
                            >
                                ›
                            </button>

                        </div>

                        <div className="tf-calendar-weekdays">
                            {WEEKDAYS.map((weekday, index) => (
                                <span key={index}>{weekday}</span>
                            ))}
                        </div>

                        <div className="tf-calendar-days">
                            {calendarCells.map((day, index) => {

                                const isSelected =
                                    selectedDate &&
                                    day === selectedDate.getDate() &&
                                    viewMonth === selectedDate.getMonth() &&
                                    viewYear === selectedDate.getFullYear();

                                return (

                                    <button
                                        key={index}
                                        type="button"
                                        className={
                                            "tf-calendar-day"
                                            + (day === null ? " is-empty" : "")
                                            + (isSelected ? " is-selected" : "")
                                        }
                                        disabled={day === null}
                                        onClick={() => handleSelectDay(day)}
                                    >
                                        {day}
                                    </button>

                                );

                            })}
                        </div>

                        <button
                            type="button"
                            className="tf-calendar-clear"
                            onClick={() => {

                                setSelectedDate(null);

                                setIsCalendarOpen(false);

                            }}
                        >
                            Clear deadline
                        </button>

                    </div>

                )}

            </div>
        </div>
    );


    // the admin picks the developers working on this task from the project's developers
    const assigneeField = (
        <div className="tf-field">
            <label htmlFor="task-assignee">Assignee</label>

            <div className="tf-anchor" ref={assigneeRef}>

                <button
                    type="button"
                    id="task-assignee"
                    className="tf-input tf-dropdown"
                    aria-haspopup="true"
                    aria-expanded={isAssigneeOpen}
                    disabled={roleName !== "Admin"}
                    title={
                        roleName === "Admin"
                            ? undefined
                            : "Only project admins can assign tasks."
                    }
                    onClick={() => {

                        setIsCalendarOpen(false);

                        setIsAssigneeOpen(!isAssigneeOpen);

                    }}
                >
                    <span className={assigneeLabel ? "" : "is-placeholder"}>
                        {assigneeLabel || "Select assignee"}
                    </span>
                    <Icon name="chevronDown" size={16} />
                </button>

                {isAssigneeOpen && (

                    <div className="tf-menu" role="group" aria-label="Available developers">

                        {members.length ? members.map((member) => (

                            <label className="tf-menu-item" key={member.user_id}>

                                <input
                                    type="checkbox"
                                    checked={isAssigned(member.user_id)}
                                    onChange={() =>
                                        toggleAssignee(member.user_id)
                                    }
                                />

                                <span className="tf-menu-check" aria-hidden="true">
                                    <Icon name="check" size={13} />
                                </span>

                                <span className="tf-menu-name">
                                    <strong>{getMemberName(member)}</strong>
                                    {member.user_email && <small>{member.user_email}</small>}
                                </span>

                            </label>

                        )) : (

                            <p className="tf-menu-empty">
                                No developers are on this project yet. Add some under Settings &rarr; Developers.
                            </p>

                        )}

                    </div>

                )}

            </div>
        </div>
    );


    const weightField = (
        <div className="tf-field">
            <label htmlFor="task-weight">Weight</label>
            <select
                id="task-weight"
                className="tf-input tf-select"
                value={taskWeight}
                disabled={isReadOnly}
                onChange={(event) =>
                    setTaskWeight(event.target.value)
                }
            >
                <option value="">Select weight</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((weight) => (
                    <option key={weight} value={weight}>{weight}</option>
                ))}
            </select>
        </div>
    );


    const priorityField = (
        <div className="tf-field">
            <label htmlFor="task-priority">Priority</label>
            <select
                id="task-priority"
                className="tf-input tf-select"
                value={taskPriority}
                disabled={isReadOnly}
                onChange={(event) =>
                    setTaskPriority(event.target.value)
                }
            >
                <option value="">Select priority</option>
                <option value="high">⌃ High</option>
                <option value="medium">- Medium</option>
                <option value="low">⌄ Low</option>
            </select>
        </div>
    );


    const statusField = (
        <div className="tf-field">
            <label htmlFor="task-status">Status</label>
            <select
                id="task-status"
                className="tf-input tf-select"
                value={statusId}
                disabled={isReadOnly}
                onChange={(event) =>
                    setStatusId(event.target.value)
                }
            >
                <option value="">Status</option>
                {statuses.map((status) => (
                    <option key={status.status_id} value={status.status_id}>
                        {status.status_name}
                    </option>
                ))}
            </select>
        </div>
    );


    const tagsField = (
        <div className="tf-field">
            <span className="tf-label" id="task-tags-label">Tags</span>

            <div className="tf-tags" ref={tagsRef} role="group" aria-labelledby="task-tags-label">

                <button
                    type="button"
                    className="tf-chip tf-chip-add"
                    aria-expanded={isTagPopupOpen}
                    disabled={roleName !== "Admin"}
                    title={
                        roleName === "Admin"
                            ? "Add a tag"
                            : "Only project admins can edit task tags."
                    }
                    onClick={() => {

                        if (roleName !== "Admin") {
                            return;
                        }

                        setTagError("");

                        setIsTagPopupOpen((open) => !open);

                    }}
                >
                    <Icon name="plus" size={14} />
                    tag
                </button>

                {projectTags.length
                    ? projectTags.map((tag) => {

                        const tagId = String(tag.tag_id);

                        const isSelected = tagIds.includes(tagId);

                        return (

                            <button
                                key={tagId}
                                type="button"
                                className={`tf-chip${isSelected ? " is-selected" : ""}`}
                                aria-pressed={isSelected}
                                title={tag.tag_desc}
                                style={
                                    isSelected
                                        ? { backgroundColor: tag.tag_colour || "#3F9B76" }
                                        : undefined
                                }
                                disabled={roleName !== "Admin"}
                                onClick={() => {

                                    if (roleName !== "Admin") {
                                        return;
                                    }

                                    setTagIds((current) =>
                                        isSelected
                                            ? current.filter((id) => id !== tagId)
                                            : [...current, tagId]
                                    );

                                }}
                            >
                                {tag.tag_name}
                            </button>

                        );

                    })
                    : (
                        <span className="tf-tags-empty">No project tags</span>
                    )
                }

                {roleName === "Admin" && isTagPopupOpen && (

                    <div className="tf-tag-popup">

                        <label className="tf-popup-label" htmlFor="new-task-tag-name">
                            Tag name
                        </label>

                        <input
                            id="new-task-tag-name"
                            className="tf-popup-input"
                            value={newTagName}
                            onChange={(event) =>
                                setNewTagName(event.target.value)
                            }
                            maxLength={40}
                            autoFocus
                        />

                        <span className="tf-popup-label">Choose a colour</span>

                        <div className="tf-swatches">
                            {TAG_COLOURS.map((colour) => (

                                <button
                                    key={colour}
                                    type="button"
                                    className={`tf-swatch${newTagColour === colour ? " is-selected" : ""}`}
                                    style={{ backgroundColor: colour }}
                                    aria-label={`Choose ${colour}`}
                                    aria-pressed={newTagColour === colour}
                                    onClick={() => setNewTagColour(colour)}
                                />

                            ))}
                        </div>

                        {tagError && (
                            <p className="tf-error" role="alert">{tagError}</p>
                        )}

                        <div className="tf-popup-buttons">

                            <button
                                type="button"
                                className="tf-btn tf-btn-light"
                                onClick={() => setIsTagPopupOpen(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="tf-btn tf-btn-dark"
                                onClick={handleAddTag}
                                disabled={!newTagName.trim() || isAddingTag}
                            >
                                {isAddingTag ? "Adding..." : "Add tag"}
                            </button>

                        </div>

                    </div>

                )}

            </div>
        </div>
    );


    const descriptionField = (
        <div className="tf-field">
            <label htmlFor="task-description">Description</label>
            <textarea
                id="task-description"
                className={`tf-textarea${isEditing ? " tf-textarea-tall" : ""}`}
                placeholder={
                    isEditing
                        ? "Description"
                        : "Add task details, requirements, and context for the assignee."
                }
                value={taskDescription}
                readOnly={isReadOnly}
                onChange={(event) =>
                    setTaskDescription(event.target.value)
                }
            ></textarea>
        </div>
    );


    const checklistCard = (
        <section className="tf-card tf-checklist" aria-labelledby="task-checklist-title">

            <h2 id="task-checklist-title">Checklist</h2>

            <div className="tf-checklist-list">

                {checklists.length === 0 && (

                    <p className="tf-checklist-empty">
                        No checklist items yet.
                    </p>

                )}

                {checklists.map((item) => (

                    <div
                        key={item.id}
                        className={`tf-checklist-item${item.completed ? " is-complete" : ""}`}
                    >

                        <label>

                            <input
                                type="checkbox"
                                checked={Boolean(item.completed)}
                                disabled={!canToggleChecklist}
                                onChange={() =>
                                    handleToggleChecklistItem(item.id)
                                }
                            />

                            <span className="tf-checklist-text">
                                <span className="tf-checklist-name">{item.text}</span>
                                <span className="tf-checklist-by">
                                    Added by {item.addedBy?.name || "Unknown user"}
                                </span>
                            </span>

                        </label>

                        {!isReadOnly && (

                            <button
                                type="button"
                                className="tf-checklist-remove"
                                onClick={() =>
                                    handleRemoveChecklistItem(item.id)
                                }
                                aria-label={`Remove ${item.text}`}
                            >
                                <Icon name="x" size={14} />
                            </button>

                        )}

                    </div>

                ))}

            </div>

            {!isReadOnly && (

                <div className="tf-checklist-add">

                    <input
                        type="text"
                        className="tf-input"
                        placeholder="Add checklist item"
                        aria-label="New checklist item"
                        value={newChecklistItem}
                        onChange={(event) =>
                            setNewChecklistItem(event.target.value)
                        }
                        onKeyDown={handleChecklistKeyDown}
                        maxLength={200}
                    />

                    <button
                        type="button"
                        className="tf-btn tf-btn-dark"
                        onClick={handleAddChecklistItem}
                        disabled={!newChecklistItem.trim()}
                        aria-label="Add checklist item"
                    >
                        <Icon name="plus" size={18} />
                    </button>

                </div>

            )}

        </section>
    );


    const errorMessage = formError && (
        <p className="tf-error tf-error-page" role="alert">{formError}</p>
    );


    /*
     * ==============================
     * EDIT TASK
     * ==============================
     */

    if (isEditing) {

        return (

            <WorkspaceShell
                profile={currentUser}
                breadcrumb={[
                    { label: "Projects", icon: "arrowLeft", onClick: onOpenProjects },
                    { label: "Tasks", onClick: onCancel },
                    { label: isReadOnly ? "View task" : "Edit task" }
                ]}
                breadcrumbStyle="card"
                sidebarExtra={
                    <div className="tf-sidebar-card">
                        <span className="tf-weight-badge">{weightBadge}</span>
                        <span>
                            <strong>Task workspace</strong>
                            <small>{isReadOnly ? "View only" : "Edit mode"}</small>
                        </span>
                    </div>
                }
                headerRight={
                    <div className="tf-header-actions">

                        {canDeleteTask && (

                            <button
                                type="button"
                                className="tf-btn tf-btn-danger"
                                onClick={handleDeleteTask}
                                disabled={isBusy}
                            >
                                {isDeleting ? "Deleting..." : "Delete task"}
                            </button>

                        )}

                        <button
                            type="button"
                            className="tf-btn tf-btn-light"
                            onClick={onCancel}
                            disabled={isBusy}
                        >
                            {isReadOnly ? "Back" : "Cancel"}
                        </button>

                        {!isReadOnly && (

                            <button
                                type="button"
                                className="tf-btn tf-btn-dark"
                                onClick={handleSaveTask}
                                disabled={isBusy}
                            >
                                {isSaving ? "Saving..." : "Save changes"}
                                {!isSaving && <Icon name="check" size={16} />}
                            </button>

                        )}

                    </div>
                }
                onOpenProjects={onOpenProjects}
                onOpenSettings={onOpenSettings}
                onSignOut={onSignOut}
            >

                <div className="tf-page">

                    <section className="tf-banner">

                        <div className="tf-banner-name">

                            <p className="tf-banner-kicker">
                                {isReadOnly ? "Task viewer" : "Task editor"}
                            </p>

                            <label className="tf-sr-only" htmlFor="task-name">Task name</label>

                            <input
                                id="task-name"
                                className="tf-banner-input"
                                type="text"
                                placeholder="Task name"
                                value={taskName}
                                readOnly={isReadOnly}
                                onChange={(event) =>
                                    setTaskName(event.target.value)
                                }
                            />

                        </div>

                        <div className="tf-banner-pill" title="Task weight">
                            <span className="tf-weight-badge">{weightBadge}</span>
                            {isReadOnly ? "View only" : "Edit task"}
                        </div>

                    </section>

                    {isReadOnly && (

                        <p className="tf-readonly-note" role="status">
                            This task is assigned to someone else, so you can view it but not change it.
                        </p>

                    )}

                    <section className="tf-card">

                        <div className="tf-row-five">
                            {deadlineField}
                            {assigneeField}
                            {weightField}
                            {priorityField}
                            {statusField}
                        </div>

                        {tagsField}

                        {descriptionField}

                    </section>

                    {checklistCard}

                    {errorMessage}

                </div>

            </WorkspaceShell>

        );

    }


    /*
     * ==============================
     * ADD TASK
     * ==============================
     */

    return (

        <WorkspaceShell
            profile={currentUser}
            breadcrumb={[
                { label: "Projects", onClick: onOpenProjects },
                { label: "Tasks", onClick: onCancel },
                { label: "Add task" }
            ]}
            breadcrumbStyle="card"
            headerRight={
                <div className="ws-chip">
                    <span className="ws-avatar" aria-hidden="true">{initial}</span>
                </div>
            }
            onOpenProjects={onOpenProjects}
            onOpenSettings={onOpenSettings}
            onSignOut={onSignOut}
        >

            <div className="tf-page">

                <section className="tf-intro">
                    <h1>Add task</h1>
                    <p>Create a new task and assign it to the right project, owner, and deadline.</p>
                </section>

                <section className="tf-card">

                    <div className="tf-grid">

                        <div className="tf-field tf-wide">
                            <label htmlFor="task-name">Task name</label>
                            <input
                                id="task-name"
                                className="tf-input"
                                type="text"
                                placeholder="Enter task name"
                                value={taskName}
                                onChange={(event) =>
                                    setTaskName(event.target.value)
                                }
                            />
                        </div>

                        {statusField}

                        <div className="tf-cell">
                            {tagsField}
                        </div>

                        {priorityField}

                        {weightField}

                        <div className="tf-wide">
                            {deadlineField}
                        </div>

                        {assigneeField}

                    </div>

                    {descriptionField}

                </section>

                {checklistCard}

                {errorMessage}

                <footer className="tf-footer">

                    <p>Review the task details before creating.</p>

                    <div className="tf-footer-buttons">

                        <button
                            type="button"
                            className="tf-btn tf-btn-light"
                            onClick={onCancel}
                            disabled={isBusy}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="tf-btn tf-btn-dark"
                            onClick={handleSaveTask}
                            disabled={isBusy}
                        >
                            {isSaving ? "Saving..." : "Create task"}
                        </button>

                    </div>

                </footer>

            </div>

        </WorkspaceShell>

    );

}


export default CreateTaskForm;
