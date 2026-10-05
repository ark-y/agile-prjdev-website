import "./ProjectCard.css";

function ProjectCard({ projectName, onOpen }) {

    return (

        // card for each project
        <button type="button" className="project-card" onClick={onOpen}>

            {/* showing the projects name */}
            <span className="project-name">
                {projectName}
            </span>

        </button>
    );
}

export default ProjectCard;