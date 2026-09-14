import { useState } from "react";

import "./CreateTaskForm.css";


function CreateTaskForm({
    onSaveTask,
    onCancel
}) {

    // task name
    const [taskName, setTaskName] =
        useState("");


    // task weight
    const [taskWeight, setTaskWeight] =
        useState("");


    // task priority
    const [taskPriority, setTaskPriority] =
        useState("");


    // saving task
    function handleSaveTask() {

        // task needs a name
        if (taskName.trim() === "") {

            return;

        }


        onSaveTask({

            name: taskName.trim(),

            weight: taskWeight,

            priority: taskPriority

        });

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



                {/* second row */}
                <section className="task-form-row">


                    {/* deadline */}
                    <button
                        type="button"
                        className="fake-dropdown deadline-dropdown"
                    >

                        <span>
                            Deadline
                        </span>

                        <span className="dropdown-arrow">
                            ▼
                        </span>

                    </button>



                    {/* assignee */}
                    <button
                        type="button"
                        className="fake-dropdown assignee-dropdown"
                    >

                        <span>
                            Assignee
                        </span>

                        <span className="dropdown-arrow">
                            ▼
                        </span>

                    </button>


                </section>



                {/* description */}
                <textarea
                    className="task-description"
                    placeholder="Description"
                ></textarea>



                {/* buttons */}
                <section className="task-form-buttons">


                    <button
                        type="button"
                        className="task-cancel-button"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        className="task-save-button"
                        onClick={handleSaveTask}
                    >
                        Save Task
                    </button>


                </section>


            </section>


        </main>

    );

}


export default CreateTaskForm;