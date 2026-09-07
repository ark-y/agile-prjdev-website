function CreateProjectForm() {

    return (

        // background behind the popup
        <section className="popup-background">

            {/* the actual popup */}
            <form className="create-project-popup">

                <h2>Create Project</h2>

                {/* getting the project name */}
                <label htmlFor="projectName">
                    Project Name
                </label>

                <input
                    type="text"
                    id="projectName"
                    placeholder="Enter project name"
                />


                {/* buttons at the bottom */}
                <section className="popup-buttons">

                    {/* closing without making a project */}
                    <button
                        type="button"
                        className="cancel-button"
                    >
                        Cancel
                    </button>

                    {/* making the project */}
                    <button
                        type="button"
                        className="create-button"
                    >
                        Create Project
                    </button>

                </section>

            </form>

        </section>
    );
}

export default CreateProjectForm;