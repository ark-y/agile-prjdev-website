import "./ProjectOverview.css";

function ProjectOverview() {

    return (

        // whole project page
        <main className="project-page">

            {/* same header as the dev landing page */}
            <header className="project-header">

                {/* project name */}
                <h1>PROJECT 1</h1>

                {/* icons on the right */}
                <section className="project-header-icons">

                    {/* messages */}
                    <button className="message-button">
                        📥
                    </button>

                    {/* settings */}
                    <button className="settings-button">
                        ⚙
                    </button>

                </section>

            </header>


            {/* everything under the header */}
            <section className="project-body">


                {/* backlog and sprints */}
                <section className="sprint-area">

                    {/* backlog is always first */}
                    <section className="sprint-box">

                        <h2>BACKLOG</h2>

                        {/* tasks will go here later */}
                        <section className="task-area">

                        </section>

                    </section>


                    {/* sample sprint */}
                    <section className="sprint-box">

                        {/* sprint name can be edited */}
                        <input
                            className="sprint-name-input"
                            type="text"
                            value="SPRINT 1"
                            readOnly
                        />

                        {/* tasks will go here later */}
                        <section className="task-area">

                        </section>

                    </section>

                </section>


                {/* fade before the grey boxes */}
                <section className="sidebar-fade"></section>


                {/* stuff on the far right */}
                <aside className="project-sidebar">


                    {/* progress box */}
                    <section className="progress-box">

                        <h2>PROGRESS</h2>

                        {/* progress bar */}
                        <section className="progress-row">

                            <section className="progress-bar">

                                {/* green part */}
                                <span className="progress-fill"></span>

                            </section>

                            <span className="progress-number">
                                46%
                            </span>

                        </section>


                        {/* info about the project */}
                        <section className="progress-info">

                            <p>Team list</p>
                            <p>Project timeline</p>
                            <p>Project due date</p>
                            <p>Client</p>

                        </section>

                    </section>


                    {/* buttons under progress */}
                    <section className="sidebar-buttons">

                        {/* adding a task */}
                        <button className="sidebar-button">

                            <span>ADD</span>

                            <span className="sidebar-plus">
                                +
                            </span>

                            <span>TASK</span>

                        </button>


                        {/* adding a sprint */}
                        <button className="sidebar-button">

                            <span>ADD</span>

                            <span className="sidebar-plus">
                                +
                            </span>

                            <span>SPRINT</span>

                        </button>

                    </section>

                </aside>

            </section>


            {/* going back to all the projects */}
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