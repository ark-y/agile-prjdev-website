import { useNavigate } from "react-router-dom";
import "./ProjectCard.css";

function ProjectCard({ projectId, projectName }) {
    const navigate = useNavigate();

    return (
        // card for each project
        <button
            className="project-card"
            onClick={() => navigate(`/project/${projectId}`)}
        >
            {/* showing the projects name */}
            <span className="project-name">
                {projectName}
            </span>
        </button>
    );
}

export default ProjectCard;