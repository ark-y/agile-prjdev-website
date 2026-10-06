import { useEffect, useState } from "react";

import "./ProjectOverview.css";


function ProjectOverview({
    tasks,
    onAddTask
}) {

    const [nextSprintNumber, setNextSprintNumber] =
        useState(2);


    const [sprints, setSprints] =
        useState([

            {
                id: 1,
                name: "SPRINT 1",
                startDate: "2026-09-11",
                endDate: "2026-09-25",
                editingDates: false
            }

        ]);


    // stores which sprint each task currently belongs to
    // null means the task is in the backlog
    const [taskSprintAssignments, setTaskSprintAssignments] =
        useState({});


    // stores the task currently being dragged
    const [draggedTaskId, setDraggedTaskId] =
        useState(null);


    // stores the sprint/backlog currently being dragged over
    const [dragOverSprintId, setDragOverSprintId] =
        useState(null);


    // when a new task is created, put it in the backlog
    useEffect(() => {

        setTaskSprintAssignments((currentAssignments) => {

            const updatedAssignments = {
                ...currentAssignments
            };


            tasks.forEach((task) => {

                if (!(task.id in updatedAssignments)) {

                    updatedAssignments[task.id] = null;

                }

            });


            return updatedAssignments;

        });

    }, [tasks]);


    // formatting sprint dates
    function formatDate(date) {

        if (!date) {

            return "--/--";

        }


        const [
            year,
            month,
            day
        ] = date.split("-");


        return `${day}/${month}`;

    }


    // converting priority into symbol
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


    // update sprint name
    function updateSprintName(
        sprintId,
        newName
    ) {

        setSprints((currentSprints) =>

            currentSprints.map((sprint) => {

                if (sprint.id === sprintId) {

                    return {
                        ...sprint,
                        name: newName
                    };

                }


                return sprint;

            })

        );

    }


    // date editor
    function setSprintDateEditing(
        sprintId,
        editing
    ) {

        setSprints((currentSprints) =>

            currentSprints.map((sprint) => {

                if (sprint.id === sprintId) {

                    return {
                        ...sprint,
                        editingDates: editing
                    };

                }


                return sprint;

            })

        );

    }


    // start date
    function updateStartDate(
        sprintId,
        newStartDate
    ) {

        setSprints((currentSprints) =>

            currentSprints.map((sprint) => {

                if (sprint.id !== sprintId) {

                    return sprint;

                }


                let newEndDate =
                    sprint.endDate;


                if (
                    newEndDate &&
                    newEndDate < newStartDate
                ) {

                    newEndDate = "";

                }


                return {

                    ...sprint,

                    startDate: newStartDate,

                    endDate: newEndDate

                };

            })

        );

    }


    // end date
    function updateEndDate(
        sprintId,
        newEndDate
    ) {

        setSprints((currentSprints) =>

            currentSprints.map((sprint) => {

                if (sprint.id === sprintId) {

                    return {

                        ...sprint,

                        endDate: newEndDate

                    };

                }


                return sprint;

            })

        );

    }


    // add sprint
    function addSprint() {

        const newSprint = {

            id: Date.now(),

            name:
                "SPRINT "
                + nextSprintNumber,

            startDate: "",

            endDate: "",

            editingDates: false

        };


        setSprints((currentSprints) => [

            ...currentSprints,

            newSprint

        ]);


        setNextSprintNumber(
            (currentNumber) =>
                currentNumber + 1
        );

    }


    // delete sprint
    function deleteSprint(
        sprintId,
        sprintName
    ) {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete "
                + sprintName
                + "?"
            );


        if (!confirmed) {

            return;

        }


        // move tasks from deleted sprint back to backlog
        setTaskSprintAssignments(
            (currentAssignments) => {

                const updatedAssignments = {
                    ...currentAssignments
                };


                Object.keys(updatedAssignments).forEach(
                    (taskId) => {

                        if (
                            updatedAssignments[taskId]
                            === sprintId
                        ) {

                            updatedAssignments[taskId] =
                                null;

                        }

                    }
                );


                return updatedAssignments;

            }
        );


        setSprints((currentSprints) =>

            currentSprints.filter(
                (sprint) =>
                    sprint.id !== sprintId
            )

        );

    }


    // when user starts dragging a task
    function handleDragStart(
        event,
        taskId
    ) {

        setDraggedTaskId(taskId);


        event.dataTransfer.setData(
            "text/plain",
            String(taskId)
        );


        event.dataTransfer.effectAllowed =
            "move";

    }


    // allows a sprint to accept a dropped task
    function handleDragOver(
        event,
        sprintId
    ) {

        event.preventDefault();


        event.dataTransfer.dropEffect =
            "move";


        setDragOverSprintId(
            sprintId
        );

    }


    // remove drag highlight when leaving sprint
    function handleDragLeave(event) {

        // prevents flickering when moving over children
        if (
            event.currentTarget.contains(
                event.relatedTarget
            )
        ) {

            return;

        }


        setDragOverSprintId(null);

    }


    // move task into selected sprint
    function handleDrop(
        event,
        sprintId
    ) {

        event.preventDefault();


        const transferredTaskId =
            event.dataTransfer.getData(
                "text/plain"
            );


        let taskId =
            draggedTaskId;


        if (
            taskId === null &&
            transferredTaskId
        ) {

            const numericTaskId =
                Number(transferredTaskId);


            taskId =
                Number.isNaN(numericTaskId)
                    ? transferredTaskId
                    : numericTaskId;

        }


        if (taskId === null) {

            return;

        }


        setTaskSprintAssignments(
            (currentAssignments) => ({

                ...currentAssignments,

                [taskId]: sprintId

            })
        );


        setDraggedTaskId(null);

        setDragOverSprintId(null);

    }


    // finish dragging
    function handleDragEnd() {

        setDraggedTaskId(null);

        setDragOverSprintId(null);

    }


    // get tasks belonging to a sprint
    function getTasksForSprint(sprintId) {

        return tasks.filter(
            (task) =>
                taskSprintAssignments[task.id]
                === sprintId
        );

    }


    // reusable task card
    function renderTaskCard(task) {

        return (

            <section
                className={
                    "task-card"
                    + (
                        draggedTaskId === task.id
                            ? " task-card-dragging"
                            : ""
                    )
                }
                key={task.id}
                draggable="true"
                onDragStart={(event) =>
                    handleDragStart(
                        event,
                        task.id
                    )
                }
                onDragEnd={
                    handleDragEnd
                }
            >


                <span
                    className="task-status-circle"
                ></span>


                <span className="task-card-name">

                    {task.name}

                </span>



                <section className="task-card-info">


                    {task.priority && (

                        <span className="task-priority">

                            {getPrioritySymbol(
                                task.priority
                            )}

                        </span>

                    )}


                    {task.weight && (

                        <span className="task-card-weight">

                            {task.weight}

                        </span>

                    )}


                </section>


            </section>

        );

    }


    const backlogTasks =
        getTasksForSprint(null);


    return (

        <main className="project-page">


            <header className="project-header">

                <h1>
                    PROJECT 1
                </h1>


                <section className="project-header-icons">

                    <button className="message-button">
                        📥
                    </button>


                    <button className="settings-button">
                        ⚙
                    </button>

                </section>

            </header>



            <section className="project-body">


                <section className="sprint-area">


                    {/* backlog */}
                    <section
                        className={
                            "sprint-box"
                            + (
                                dragOverSprintId === "backlog"
                                    ? " sprint-box-drag-over"
                                    : ""
                            )
                        }
                        onDragOver={(event) =>
                            handleDragOver(
                                event,
                                "backlog"
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


                        <h2>
                            BACKLOG
                        </h2>


                        <section className="task-area">


                            {backlogTasks.map(
                                (task) =>
                                    renderTaskCard(task)
                            )}


                            {backlogTasks.length === 0 && (

                                <p className="empty-sprint-message">
                                    Drop tasks here
                                </p>

                            )}


                        </section>


                    </section>



                    {/* sprints */}
                    {sprints.map((sprint) => {

                        const sprintTasks =
                            getTasksForSprint(
                                sprint.id
                            );


                        return (

                            <section
                                className={
                                    "sprint-box"
                                    + (
                                        dragOverSprintId === sprint.id
                                            ? " sprint-box-drag-over"
                                            : ""
                                    )
                                }
                                key={sprint.id}
                                onDragOver={(event) =>
                                    handleDragOver(
                                        event,
                                        sprint.id
                                    )
                                }
                                onDragLeave={
                                    handleDragLeave
                                }
                                onDrop={(event) =>
                                    handleDrop(
                                        event,
                                        sprint.id
                                    )
                                }
                            >


                                <button
                                    type="button"
                                    className="delete-sprint-button"
                                    aria-label="Delete sprint"
                                    onClick={() =>
                                        deleteSprint(
                                            sprint.id,
                                            sprint.name
                                        )
                                    }
                                >
                                    ×
                                </button>



                                <input
                                    className="sprint-name-input"
                                    type="text"
                                    value={sprint.name}
                                    onChange={(event) =>
                                        updateSprintName(
                                            sprint.id,
                                            event.target.value
                                        )
                                    }
                                />



                                <section className="sprint-dates">


                                    {!sprint.editingDates ? (

                                        <button
                                            type="button"
                                            className="sprint-date-display"
                                            onClick={() =>
                                                setSprintDateEditing(
                                                    sprint.id,
                                                    true
                                                )
                                            }
                                        >

                                            {formatDate(
                                                sprint.startDate
                                            )}

                                            {" - "}

                                            {formatDate(
                                                sprint.endDate
                                            )}

                                        </button>

                                    ) : (

                                        <section className="sprint-date-editor">


                                            <input
                                                type="date"
                                                value={sprint.startDate}
                                                onChange={(event) =>
                                                    updateStartDate(
                                                        sprint.id,
                                                        event.target.value
                                                    )
                                                }
                                            />


                                            <span>
                                                -
                                            </span>


                                            <input
                                                type="date"
                                                value={sprint.endDate}
                                                min={sprint.startDate}
                                                onChange={(event) =>
                                                    updateEndDate(
                                                        sprint.id,
                                                        event.target.value
                                                    )
                                                }
                                            />


                                            <button
                                                type="button"
                                                className="date-done-button"
                                                onClick={() =>
                                                    setSprintDateEditing(
                                                        sprint.id,
                                                        false
                                                    )
                                                }
                                            >
                                                ✓
                                            </button>


                                        </section>

                                    )}


                                </section>



                                <section className="task-area">


                                    {sprintTasks.map(
                                        (task) =>
                                            renderTaskCard(task)
                                    )}


                                    {sprintTasks.length === 0 && (

                                        <p className="empty-sprint-message">
                                            Drop tasks here
                                        </p>

                                    )}


                                </section>


                            </section>

                        );

                    })}


                </section>



                <section className="sidebar-fade">

                </section>



                <aside className="project-sidebar">


                    <section className="progress-box">


                        <h2>
                            PROGRESS
                        </h2>


                        <section className="progress-row">


                            <section className="progress-bar">

                                <span className="progress-fill">

                                </span>

                            </section>


                            <span className="progress-number">
                                46%
                            </span>


                        </section>


                        <section className="progress-info">

                            <p>Team list</p>

                            <p>Project timeline</p>

                            <p>Project due date</p>

                            <p>Client</p>

                        </section>


                    </section>



                    <section className="sidebar-buttons">


                        <button
                            className="sidebar-button"
                            onClick={onAddTask}
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
                            className="sidebar-button"
                            onClick={addSprint}
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


                </aside>


            </section>



            <button
                type="button"
                className="back-projects-button"
            >
                ← Back to Projects
            </button>


        </main>

    );

}


export default ProjectOverview;