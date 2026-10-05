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


    // saving task
    async function handleSaveTask() {
        if (!taskName.trim() || !sprintId || !taskWeight || !taskPriority) {
            setFormError("Enter a name and choose a sprint, priority, and weight.");
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
                sprintId: Number(sprintId),
                statusId: statusId ? Number(statusId) : null,
                assigneeIds
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


                    {/* tags */}
                    <section className="task-tags">


                        <button
                            type="button"
                            className="add-tag-button"
                        >
                            + tag
                        </button>


                        <button
                            type="button"
                            className="tag-button tag-green"
                        >
                            Tag 1
                        </button>


                        <button
                            type="button"
                            className="tag-button tag-purple"
                        >
                            Long Tag 2
                        </button>


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

                <section className="task-form-row">
                    <label>
                        Sprint
                        <select
                            value={sprintId}
                            onChange={(event) => setSprintId(event.target.value)}
                        >
                            <option value="">Choose a sprint</option>
                            {sprints.map((sprint) => (
                                <option key={sprint.sprint_id} value={sprint.sprint_id}>
                                    {sprint.sprint_name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Status
                        <select
                            value={statusId}
                            onChange={(event) => setStatusId(event.target.value)}
                        >
                            <option value="">No status</option>
                            {statuses.map((status) => (
                                <option key={status.status_id} value={status.status_id}>
                                    {status.status_name}
                                </option>
                            ))}
                        </select>
                    </label>
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


                            </section>

                        )}


                    </section>



                    {/* assignee */}
                    <label className="assignee-dropdown">
                        Assignees
                        <select
                            multiple
                            value={assigneeIds}
                            onChange={(event) =>
                                setAssigneeIds(
                                    Array.from(event.target.selectedOptions, (option) => option.value)
                                )
                            }
                            aria-label="Task assignees"
                            size={Math.min(Math.max(members.length, 2), 5)}
                        >
                            {members.map((member) => (
                                <option key={member.user_id} value={member.user_id}>
                                    {member.user_pref_name || `${member.user_first_name} ${member.user_last_name}`}
                                </option>
                            ))}
                        </select>
                    </label>


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
