import "./ProjectCard.css";

function ProjectCard({ projectName }) {

    return (

        // card for each project
        <button className="project-card">

            {/* showing the projects name */}
            <span className="project-name">
                {projectName}
            </span>

        </button>
    );
}

export default ProjectCard;