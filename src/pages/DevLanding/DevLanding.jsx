import ProjectCard from "../../components/ProjectCard/ProjectCard";
import "./DevLanding.css";

function DevLanding({
    projects = [],
    canCreateProject = false,
    onOpenProject,
    onAddProject,
    onDeleteProject,
    onOpenSettings,
    onSignOut
}) {

    return (
        <main className="dev-page">

            {/* top bar */}
            <header className="dashboard-header">

                <h1>PROJECTS</h1>

                {/* icons on the right */}
                <section className="dashboard-icons">

                    <button type="button" className="icon-button" onClick={onSignOut}>
                        Sign out
                    </button>
                    <button
                        type="button"
                        className="icon-button"
                        onClick={onOpenSettings}
                    >
                        Settings
                    </button>

                </section>

            </header>


            {/* where all the projects will go */}
            <section className="projects-section">

                {/* button for making a new project */}
                {projects.map((project) => (
                    <section className="project-tile" key={project.project_id}>
                        <ProjectCard
                            projectName={project.project_name}
                            onOpen={() => onOpenProject(project)}
                        />
                        {canCreateProject && (
                            <button
                                type="button"
                                className="delete-project-tile"
                                onClick={() => onDeleteProject(project)}
                            >
                                Delete
                            </button>
                        )}
                    </section>
                ))}

                {canCreateProject && (
                    <button
                        type="button"
                        className="add-project"
                        onClick={onAddProject}
                        aria-label="Add project"
                    >
                        +
                    </button>
                )}

            </section>

        </main>
    );
}

export default DevLanding;