import { useState } from "react";

import "./CreateTaskForm.css";


const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];


function CreateTaskForm({
    onSaveTask,
    onCancel,
    onDeleteTask,
    initialTask = null,
    sprints = [],
    statuses = [],
    projectTags = [],
    onAddTag,
    members = [],
    roleName = "",
    currentUser = null
}) {

    // whether we are creating a new task or editing an existing task
    const isEditing = Boolean(initialTask?.task_id);

    // admins and developers can edit tasks
    const canEditTask =
        roleName === "Admin" ||
        roleName === "Developer";

    // only admins can delete tasks
    const canDeleteTask =
        roleName === "Admin";


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
    const [sprintId, setSprintId] =
        useState(initialTask?.sprint_id?.toString() || "");


    // task status
    const [statusId, setStatusId] =
        useState(initialTask?.task_status_id?.toString() || "");


    // assignees
    const [assigneeIds, setAssigneeIds] =
        useState(initialTask?.assigneeIds || []);


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
        : "Deadline";


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

        setChecklists((current) =>
            current.filter(
                (item) =>
                    item.id !== itemId
            )
        );

    }


    // saving task
    async function handleSaveTask() {

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


    return (

        // whole task form page
        <main className="task-form-page">


            {/* top blue bit */}
            <header className="task-form-header">


                {/* task name */}
                <input
                    className="task-name-input"
                    type="text"
                    placeholder="Task name"
                    value={taskName}
                    onChange={(event) =>
                        setTaskName(
                            event.target.value
                        )
                    }
                />


                {/* selected weight shown at top */}
                <span className="task-weight-number">

                    {taskWeight}

                </span>


            </header>



            {/* everything under header */}
            <section className="task-form-body">


                {/* top row */}
                <section className="task-form-row">


                    <section className="task-tags">

                        <button
                            type="button"
                            className="add-tag-button"
                            aria-expanded={
                                isTagPopupOpen
                            }
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

                                setIsTagPopupOpen(
                                    (open) => !open
                                );

                            }}
                        >

                            + tag

                        </button>


                        {projectTags.length
                            ? projectTags.map((tag) => {

                                const tagId =
                                    String(tag.tag_id);


                                const isSelected =
                                    tagIds.includes(
                                        tagId
                                    );


                                return (

                                    <button
                                        key={tagId}
                                        type="button"
                                        className="tag-button"
                                        aria-pressed={
                                            isSelected
                                        }
                                        title={
                                            tag.tag_desc
                                        }
                                        style={{
                                            backgroundColor:
                                                tag.tag_colour ||
                                                "#3F9B76",

                                            opacity:
                                                isSelected
                                                    ? 1
                                                    : 0.55
                                        }}
                                        disabled={roleName !== "Admin"}
                                        onClick={() => {

                                            if (roleName !== "Admin") {
                                                return;
                                            }

                                            setTagIds(
                                                (current) =>
                                                    isSelected
                                                        ? current.filter(
                                                            (id) =>
                                                                id !== tagId
                                                        )
                                                        : [
                                                            ...current,
                                                            tagId
                                                        ]
                                            );

                                        }}
                                    >

                                        {tag.tag_name}

                                    </button>

                                );

                            })
                            : (
                                <span>
                                    No project tags
                                </span>
                            )
                        }


                        {roleName === "Admin" && isTagPopupOpen && (

                            <section className="tag-popup">


                                <label
                                    className="tag-popup-label"
                                    htmlFor="new-task-tag-name"
                                >

                                    Tag name

                                </label>


                                <input
                                    id="new-task-tag-name"
                                    className="tag-name-input"
                                    value={newTagName}
                                    onChange={(event) =>
                                        setNewTagName(
                                            event.target.value
                                        )
                                    }
                                    maxLength={40}
                                    autoFocus
                                />


                                <span className="tag-popup-label">

                                    Choose a colour

                                </span>


                                <section className="tag-colour-grid">

                                    {[
                                        "#3F9B76",
                                        "#963A91",
                                        "#3976B8",
                                        "#D18B2C",
                                        "#B94A48",
                                        "#5B8C5A",
                                        "#5967A8",
                                        "#B45F91",
                                        "#4A8F9C",
                                        "#777777"
                                    ].map((colour) => (

                                        <button
                                            key={colour}
                                            type="button"
                                            className={
                                                `tag-colour-swatch${
                                                    newTagColour === colour
                                                        ? " tag-colour-swatch-selected"
                                                        : ""
                                                }`
                                            }
                                            style={{
                                                backgroundColor:
                                                    colour
                                            }}
                                            aria-label={
                                                `Choose ${colour}`
                                            }
                                            aria-pressed={
                                                newTagColour ===
                                                colour
                                            }
                                            onClick={() =>
                                                setNewTagColour(
                                                    colour
                                                )
                                            }
                                        />

                                    ))}

                                </section>


                                {tagError && (

                                    <p
                                        className="task-form-error"
                                        role="alert"
                                    >

                                        {tagError}

                                    </p>

                                )}


                                <section className="tag-popup-buttons">


                                    <button
                                        type="button"
                                        className="tag-popup-cancel"
                                        onClick={() =>
                                            setIsTagPopupOpen(
                                                false
                                            )
                                        }
                                    >

                                        Cancel

                                    </button>


                                    <button
                                        type="button"
                                        className="tag-popup-add"
                                        onClick={
                                            handleAddTag
                                        }
                                        disabled={
                                            !newTagName.trim() ||
                                            isAddingTag
                                        }
                                    >

                                        {isAddingTag
                                            ? "Adding..."
                                            : "Add tag"
                                        }

                                    </button>


                                </section>


                            </section>

                        )}


                    </section>



                    {/* priority and weight */}
                    <section className="task-options">


                        {/* priority */}
                        <section className="priority-wrapper">


                            <select
                                className="priority-select"
                                value={taskPriority}
                                onChange={(event) =>
                                    setTaskPriority(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Priority
                                </option>

                                <option value="high">
                                    ⌃ High
                                </option>

                                <option value="medium">
                                    - Medium
                                </option>

                                <option value="low">
                                    ⌄ Low
                                </option>

                            </select>


                            <span className="select-arrow">
                                ▼
                            </span>


                        </section>



                        {/* weight */}
                        <section className="weight-wrapper">


                            <select
                                className="weight-select"
                                value={taskWeight}
                                onChange={(event) =>
                                    setTaskWeight(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Weight
                                </option>

                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="7">7</option>
                                <option value="8">8</option>
                                <option value="9">9</option>
                                <option value="10">10</option>

                            </select>


                            <span className="select-arrow">
                                ▼
                            </span>


                        </section>


                    </section>


                </section>



                {/* second row */}
                <section className="task-form-row">


                    {/* deadline */}
                    <section className="deadline-wrapper">


                        <button
                            type="button"
                            className="fake-dropdown deadline-dropdown"
                            onClick={() =>
                                setIsCalendarOpen(
                                    !isCalendarOpen
                                )
                            }
                        >

                            <span>
                                {deadlineLabel}
                            </span>

                            <span className="dropdown-arrow">
                                ▼
                            </span>

                        </button>


                        {/* calendar popup */}
                        {isCalendarOpen && (

                            <section className="deadline-calendar">


                                <section className="calendar-header">


                                    <button
                                        type="button"
                                        className="calendar-nav-button"
                                        onClick={
                                            goToPreviousMonth
                                        }
                                    >
                                        ‹
                                    </button>


                                    <span className="calendar-month-label">

                                        {MONTH_NAMES[viewMonth]} {viewYear}

                                    </span>


                                    <button
                                        type="button"
                                        className="calendar-nav-button"
                                        onClick={
                                            goToNextMonth
                                        }
                                    >
                                        ›
                                    </button>


                                </section>


                                <section className="calendar-weekdays">

                                    {WEEKDAYS.map(
                                        (weekday, index) => (

                                            <span
                                                key={index}
                                                className="calendar-weekday"
                                            >

                                                {weekday}

                                            </span>

                                        )
                                    )}

                                </section>


                                <section className="calendar-days">

                                    {calendarCells.map(
                                        (day, index) => {

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
                                                        "calendar-day"
                                                        + (
                                                            day === null
                                                                ? " calendar-day-empty"
                                                                : ""
                                                        )
                                                        + (
                                                            isSelected
                                                                ? " calendar-day-selected"
                                                                : ""
                                                        )
                                                    }
                                                    disabled={
                                                        day === null
                                                    }
                                                    onClick={() =>
                                                        handleSelectDay(
                                                            day
                                                        )
                                                    }
                                                >

                                                    {day}

                                                </button>

                                            );

                                        }
                                    )}

                                </section>


                                <button
                                    type="button"
                                    className="calendar-clear-button"
                                    onClick={() => {

                                        setSelectedDate(
                                            null
                                        );

                                        setIsCalendarOpen(
                                            false
                                        );

                                    }}
                                >

                                    Clear deadline

                                </button>


                            </section>

                        )}


                    </section>



                    <section className="task-details">


                        {/* task status */}
                        <section className="task-status-wrapper">


                            <select
                                className="task-status-select"
                                value={statusId}
                                onChange={(event) =>
                                    setStatusId(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Task Status
                                </option>


                                {statuses.map(
                                    (status) => (

                                        <option
                                            key={
                                                status.status_id
                                            }
                                            value={
                                                status.status_id
                                            }
                                        >

                                            {status.status_name}

                                        </option>

                                    )
                                )}

                            </select>


                            <span className="select-arrow">
                                ▼
                            </span>


                        </section>



                        {/* assignee */}
                        <section className="assignee-wrapper">


                            <select
                                className="assignee-select"
                                multiple
                                value={assigneeIds}
                                disabled={roleName !== "Admin"}
                                onChange={(event) =>
                                    setAssigneeIds(
                                        Array.from(
                                            event.target.selectedOptions,
                                            (option) =>
                                                option.value
                                        )
                                    )
                                }
                                aria-label="Task assignees"
                                size={1}
                            >

                                <option
                                    value=""
                                    disabled
                                >

                                    Assignee

                                </option>


                                {members.map(
                                    (member) => (

                                        <option
                                            key={
                                                member.user_id
                                            }
                                            value={
                                                member.user_id
                                            }
                                        >

                                            {
                                                member.user_pref_name ||
                                                `${member.user_first_name} ${member.user_last_name}`
                                            }

                                        </option>

                                    )
                                )}

                            </select>


                            <span className="select-arrow">
                                ▼
                            </span>


                        </section>


                    </section>


                </section>



                {/* description */}
                <textarea
                    className="task-description"
                    placeholder="Description"
                    value={taskDescription}
                    onChange={(event) =>
                        setTaskDescription(
                            event.target.value
                        )
                    }
                ></textarea>



                {/* checklist */}
                <section className="task-checklist-section">


                    <h2>
                        Checklist
                    </h2>


                    <section className="task-checklist-list">


                        {checklists.length === 0 && (

                            <p className="task-checklist-empty">

                                No checklist items yet.

                            </p>

                        )}


                        {checklists.map((item) => (

                            <section
                                key={item.id}
                                className={
                                    `task-checklist-item${
                                        item.completed
                                            ? " task-checklist-item-complete"
                                            : ""
                                    }`
                                }
                            >


                                <label>


                                    <input
                                        type="checkbox"
                                        checked={
                                            Boolean(
                                                item.completed
                                            )
                                        }
                                        onChange={() =>
                                            handleToggleChecklistItem(
                                                item.id
                                            )
                                        }
                                    />


                                    <section className="task-checklist-text">

                                        <span className="task-checklist-item-text">
                                            {item.text}
                                        </span>

                                        <span className="task-checklist-added-by">
                                            Added by {item.addedBy?.name || "Unknown user"}
                                        </span>

                                    </section>


                                </label>


                                <button
                                    type="button"
                                    className="task-checklist-remove"
                                    onClick={() =>
                                        handleRemoveChecklistItem(
                                            item.id
                                        )
                                    }
                                    aria-label={
                                        `Remove ${item.text}`
                                    }
                                >

                                    ×

                                </button>


                            </section>

                        ))}


                    </section>



                    <section className="task-checklist-add-row">


                        <input
                            type="text"
                            placeholder="Add checklist item"
                            value={newChecklistItem}
                            onChange={(event) =>
                                setNewChecklistItem(
                                    event.target.value
                                )
                            }
                            onKeyDown={
                                handleChecklistKeyDown
                            }
                            maxLength={200}
                        />


                        <button
                            type="button"
                            onClick={
                                handleAddChecklistItem
                            }
                            disabled={
                                !newChecklistItem.trim()
                            }
                            aria-label="Add checklist item"
                        >

                            +

                        </button>


                    </section>


                </section>



                {/* errors */}
                {formError && (

                    <p
                        className="task-form-error"
                        role="alert"
                    >

                        {formError}

                    </p>

                )}



                {/* buttons */}
                <section className="task-form-buttons">


                    {/* admin-only delete when editing */}
                    {isEditing && canDeleteTask && (

                        <button
                            type="button"
                            className="task-delete-edit-button"
                            onClick={
                                handleDeleteTask
                            }
                            disabled={
                                isSaving ||
                                isDeleting
                            }
                        >

                            {isDeleting
                                ? "Deleting..."
                                : "Delete Task"
                            }

                        </button>

                    )}


                    <button
                        type="button"
                        className="task-cancel-button"
                        onClick={onCancel}
                        disabled={
                            isSaving ||
                            isDeleting
                        }
                    >

                        Cancel

                    </button>


                    <button
                        type="button"
                        className="task-save-button"
                        onClick={
                            handleSaveTask
                        }
                        disabled={
                            isSaving ||
                            isDeleting
                        }
                    >

                        {isSaving
                            ? "Saving..."
                            : isEditing
                                ? "Save Changes"
                                : "Save Task"
                        }

                    </button>


                </section>


            </section>


        </main>

    );

}


export default CreateTaskForm;
