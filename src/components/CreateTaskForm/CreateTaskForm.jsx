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
    initialTask = null,
    sprints = [],
    statuses = [],
    projectTags = [],
    onAddTag,
    members = []
}) {

    // task name
    const [taskName, setTaskName] =
        useState(initialTask?.task_name || "");


    // task weight
    const [taskWeight, setTaskWeight] =
        useState(initialTask?.task_weight?.toString() || "");


    // task priority
    const [taskPriority, setTaskPriority] =
        useState(initialTask?.task_priority || "");

    const [taskDescription, setTaskDescription] =
        useState(initialTask?.task_desc || "");

    const [sprintId, setSprintId] =
        useState(initialTask?.sprint_id?.toString() || "");

    const [statusId, setStatusId] =
        useState(initialTask?.task_status_id?.toString() || "");

    const [assigneeIds, setAssigneeIds] =
        useState(initialTask?.assigneeIds || []);

    const [tagIds, setTagIds] =
        useState(initialTask?.tagIds || []);

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

    const [formError, setFormError] =
        useState("");


    // whether the deadline calendar is open
    const [isCalendarOpen, setIsCalendarOpen] =
        useState(false);


    // the date the user has picked, if any
    const [selectedDate, setSelectedDate] =
        useState(initialTask?.task_deadline
            ? new Date(`${initialTask.task_deadline.slice(0, 10)}T00:00:00`)
            : null);


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
            const tag = await onAddTag?.(newTagName, newTagColour);
            if (!tag?.tag_id) {
                throw new Error("Could not create the tag.");
            }

            const tagId = String(tag.tag_id);
            setTagIds((current) => current.includes(tagId)
                ? current
                : [...current, tagId]
            );
            setNewTagName("");
            setIsTagPopupOpen(false);
        } catch (error) {
            setTagError(error.message || "Could not create the tag.");
        } finally {
            setIsAddingTag(false);
        }
    }

    // saving task
    async function handleSaveTask() {
        if (!taskName.trim() || !taskWeight || !taskPriority) {
            setFormError("Enter a name and choose a priority and weight.");
            return;
        }

        setIsSaving(true);
        setFormError("");

        try {
            await onSaveTask?.({
                taskId: initialTask?.task_id,
                name: taskName.trim(),
                description: taskDescription,
                weight: taskWeight,
                priority: taskPriority,
                deadline: selectedDate
                    ? [
                        selectedDate.getFullYear(),
                        String(selectedDate.getMonth() + 1).padStart(2, "0"),
                        String(selectedDate.getDate()).padStart(2, "0")
                    ].join("-")
                    : null,
                sprintId: sprintId ? Number(sprintId) : null,
                statusId: statusId ? Number(statusId) : null,
                assigneeIds,
                tagIds
            });
        } catch (error) {
            setFormError(error.message || "Could not save the task.");
        } finally {
            setIsSaving(false);
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
                        setTaskName(event.target.value)
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
                            aria-expanded={isTagPopupOpen}
                            onClick={() => {
                                setTagError("");
                                setIsTagPopupOpen((open) => !open);
                            }}
                        >
                            + tag
                        </button>
                        {projectTags.length ? projectTags.map((tag) => {
                            const tagId = String(tag.tag_id);
                            const isSelected = tagIds.includes(tagId);
                            return (
                                <button
                                    key={tagId}
                                    type="button"
                                    className="tag-button"
                                    aria-pressed={isSelected}
                                    title={tag.tag_desc}
                                    style={{
                                        backgroundColor: tag.tag_colour || "#3F9B76",
                                        opacity: isSelected ? 1 : 0.55
                                    }}
                                    onClick={() => setTagIds((current) => isSelected
                                        ? current.filter((id) => id !== tagId)
                                        : [...current, tagId]
                                    )}
                                >
                                    {tag.tag_name}
                                </button>
                            );
                        }) : <span>No project tags</span>}
                        {isTagPopupOpen && (
                            <section className="tag-popup">
                                <label className="tag-popup-label" htmlFor="new-task-tag-name">
                                    Tag name
                                </label>
                                <input
                                    id="new-task-tag-name"
                                    className="tag-name-input"
                                    value={newTagName}
                                    onChange={(event) => setNewTagName(event.target.value)}
                                    maxLength={40}
                                    autoFocus
                                />
                                <span className="tag-popup-label">Choose a colour</span>
                                <section className="tag-colour-grid">
                                    {[
                                        "#3F9B76", "#963A91", "#3976B8", "#D18B2C", "#B94A48",
                                        "#5B8C5A", "#5967A8", "#B45F91", "#4A8F9C", "#777777"
                                    ].map((colour) => (
                                        <button
                                            key={colour}
                                            type="button"
                                            className={`tag-colour-swatch${newTagColour === colour ? " tag-colour-swatch-selected" : ""}`}
                                            style={{ backgroundColor: colour }}
                                            aria-label={`Choose ${colour}`}
                                            aria-pressed={newTagColour === colour}
                                            onClick={() => setNewTagColour(colour)}
                                        />
                                    ))}
                                </section>
                                {tagError && <p className="task-form-error" role="alert">{tagError}</p>}
                                <section className="tag-popup-buttons">
                                    <button
                                        type="button"
                                        className="tag-popup-cancel"
                                        onClick={() => setIsTagPopupOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="tag-popup-add"
                                        onClick={handleAddTag}
                                        disabled={!newTagName.trim() || isAddingTag}
                                    >
                                        {isAddingTag ? "Adding..." : "Add tag"}
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
                                    setTaskPriority(event.target.value)
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
                                    setTaskWeight(event.target.value)
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
                                setIsCalendarOpen(!isCalendarOpen)
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
                                        onClick={goToPreviousMonth}
                                    >
                                        ‹
                                    </button>


                                    <span className="calendar-month-label">
                                        {MONTH_NAMES[viewMonth]} {viewYear}
                                    </span>


                                    <button
                                        type="button"
                                        className="calendar-nav-button"
                                        onClick={goToNextMonth}
                                    >
                                        ›
                                    </button>


                                </section>


                                <section className="calendar-weekdays">

                                    {WEEKDAYS.map((weekday, index) => (

                                        <span
                                            key={index}
                                            className="calendar-weekday"
                                        >
                                            {weekday}
                                        </span>

                                    ))}

                                </section>


                                <section className="calendar-days">

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
                                                    "calendar-day"
                                                    + (day === null ? " calendar-day-empty" : "")
                                                    + (isSelected ? " calendar-day-selected" : "")
                                                }
                                                disabled={day === null}
                                                onClick={() =>
                                                    handleSelectDay(day)
                                                }
                                            >
                                                {day}
                                            </button>

                                        );

                                    })}

                                </section>

                                <button
                                    type="button"
                                    className="calendar-clear-button"
                                    onClick={() => {
                                        setSelectedDate(null);
                                        setIsCalendarOpen(false);
                                    }}
                                >
                                    Clear deadline
                                </button>


                            </section>

                        )}

                        </section>

                        <section class="task-details">
                            {/* task status */}
                            <section className="task-status-wrapper">
                                <select
                                    className="task-status-select"
                                    value={statusId}
                                    onChange={(event) => setStatusId(event.target.value)}
                                >
                                    <option value="">Task Status</option>

                                    {statuses.map((status) => (
                                        <option
                                            key={status.status_id}
                                            value={status.status_id}
                                        >
                                            {status.status_name}
                                        </option>
                                    ))}
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
                                    onChange={(event) =>
                                        setAssigneeIds(
                                            Array.from(
                                                event.target.selectedOptions,
                                                (option) => option.value
                                            )
                                        )
                                    }
                                    aria-label="Task assignees"
                                    size={1}
                                >
                                    <option value="" disabled>
                                        Assignee
                                    </option>

                                    {members.map((member) => (
                                        <option
                                            key={member.user_id}
                                            value={member.user_id}
                                        >
                                            {member.user_pref_name ||
                                                `${member.user_first_name} ${member.user_last_name}`}
                                        </option>
                                    ))}
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
                    onChange={(event) => setTaskDescription(event.target.value)}
                ></textarea>



                {/* buttons */}
                {formError && (
                    <p className="task-form-error" role="alert">
                        {formError}
                    </p>
                )}

                <section className="task-form-buttons">


                    <button
                        type="button"
                        className="task-cancel-button"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        className="task-save-button"
                        onClick={handleSaveTask}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save Task"}
                    </button>


                </section>


            </section>


        </main>

    );

}


export default CreateTaskForm;
