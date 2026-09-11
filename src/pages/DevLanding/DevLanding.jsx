import { useState } from "react";
import "./DevLanding.css";
import CreateProjectForm from "../../components/CreateProjectForm/CreateProjectForm";
import ProjectCard from "../../components/ProjectCard/ProjectCard";

function DevLanding() {
    // Projects are now objects with id and name
    const [projects, setProjects] = useState([
        { id: 1, name: "Sample Project" }
    ]);

    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const handleCreateProject = (newProjectName) => {
        const newProject = {
            id: Date.now(), // simple unique id for now (Supabase will do this properly later)
            name: newProjectName,
        };
        setProjects([...projects, newProject]);
    };

    return (
        <main className="dev-page">
            <header className="dashboard-header">
                <h1>X'S DASHBOARD</h1>
                <section className="dashboard-icons">
                    <button className="icon-button">📥</button>
                    <button className="icon-button">⚙</button>
                </section>
            </header>

            <section className="projects-section">
                <button
                    className="add-project"
                    onClick={() => setIsPopupOpen(true)}
                >
                    +
                </button>

                {projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        projectId={project.id}
                        projectName={project.name}
                    />
                ))}
            </section>

            {isPopupOpen && (
                <CreateProjectForm
                    onClose={() => setIsPopupOpen(false)}
                    onCreate={handleCreateProject}
                />
            )}
        </main>
    );
}

export default DevLanding;