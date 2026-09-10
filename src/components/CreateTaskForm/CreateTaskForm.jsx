import "./CreateTaskForm.css";

function CreateTaskForm() {

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
                />

                {/* shows the weight of the task */}
                <span className="task-weight-number">

                </span>

            </header>


            {/* everything under the header */}
            <section className="task-form-body">


                {/* top row with tags and weight */}
                <section className="task-form-row">

                    {/* tags on the left */}
                    <section className="task-tags">

                        {/* adding another tag */}
                        <button
                            type="button"
                            className="add-tag-button"
                        >
                            + tag
                        </button>

                        {/* sample tags for now */}
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


                    {/* choosing the task weight */}
                    <section className="weight-wrapper">

                        <select className="weight-select">

                            <option value="">Weight</option>
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

                        {/* our own arrow */}
                        <span className="select-arrow">
                            ▼
                        </span>

                    </section>

                </section>


                {/* second row */}
                <section className="task-form-row">

                    {/* deadline dropdown just for now */}
                    <button
                        type="button"
                        className="fake-dropdown deadline-dropdown"
                    >

                        <span>Deadline</span>

                        <span className="dropdown-arrow">
                            ▼
                        </span>

                    </button>


                    {/* assignee dropdown just for now */}
                    <button
                        type="button"
                        className="fake-dropdown assignee-dropdown"
                    >

                        <span>Assignee</span>

                        <span className="dropdown-arrow">
                            ▼
                        </span>

                    </button>

                </section>


                {/* task description */}
                <textarea
                    className="task-description"
                    placeholder="Description"
                ></textarea>


                {/* buttons at the bottom */}
                <section className="task-form-buttons">

                    {/* closing without saving */}
                    <button
                        type="button"
                        className="task-cancel-button"
                    >
                        Cancel
                    </button>

                    {/* saving the task */}
                    <button
                        type="button"
                        className="task-save-button"
                    >
                        Save Task
                    </button>

                </section>

            </section>

        </main>
    );
}

export default CreateTaskForm;