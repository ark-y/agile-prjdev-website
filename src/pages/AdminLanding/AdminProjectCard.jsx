import Icon from "../../components/Icons/Icons";
import { STATUS_COMPLETED, STATUS_IN_PROGRESS } from "./projectSummary";
import "./AdminProjectCard.css";

const PROJECT_ICONS = ["folder", "window", "phone", "chart"];
const AVATAR_TONES = ["blue", "salmon", "light"];

function statusTone(status) {
    if (status === STATUS_IN_PROGRESS) {
        return "progress";
    }
    return status === STATUS_COMPLETED ? "completed" : "planning";
}

function iconFor(projectId) {
    const sum = [...String(projectId)].reduce((total, char) => total + char.charCodeAt(0), 0);
    return PROJECT_ICONS[sum % PROJECT_ICONS.length];
}

function AdminProjectCard({ project, summary, summaryState, onOpen, onDelete }) {
    return (
        <article className="admin-card">
            <header className="admin-card-header">
                <span className="admin-card-icon">
                    <Icon name={iconFor(project.project_id)} size={20} />
                </span>
                <div className="admin-card-heading">
                    <h3>{project.project_name}</h3>
                    {summary && (
                        <p>{summary.clientName || "No client added yet"}</p>
                    )}
                </div>
                <button
                    type="button"
                    className="admin-card-delete"
                    aria-label={`Delete ${project.project_name}`}
                    onClick={() => onDelete(project)}
                >
                    <Icon name="trash" size={13} />
                    Delete
                </button>
            </header>

            <p className="admin-card-description">
                {project.project_desc || "No description yet."}
            </p>

            {summary ? (
                <>
                    <div className="admin-card-sprint">
                        <span className="admin-card-sprint-name">
                            {summary.sprintName || "No sprint yet"}
                        </span>
                        <span className="admin-card-pills">
                            {summary.overdue && <span className="pill pill-overdue">Overdue</span>}
                            <span className={`pill pill-${statusTone(summary.status)}`}>{summary.status}</span>
                        </span>
                    </div>

                    <div className="admin-card-progress">
                        <div className="admin-card-progress-row">
                            <span>{summary.progressLabel}</span>
                            <strong>{summary.done} / {summary.total} tasks</strong>
                        </div>
                        <div
                            className="admin-card-track"
                            role="progressbar"
                            aria-label={`${project.project_name} ${summary.progressLabel.toLowerCase()}`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={summary.percent}
                        >
                            <div className="admin-card-fill" style={{ width: `${summary.percent}%` }} />
                        </div>
                    </div>
                </>
            ) : (
                <p className="admin-card-pending" role="status">
                    {summaryState === "error" ? "Progress is unavailable right now." : "Loading progress..."}
                </p>
            )}

            <footer className="admin-card-footer">
                <div className="admin-card-team">
                    {summary?.avatars.map((avatar, index) => (
                        <span
                            key={avatar.id}
                            className={`admin-avatar admin-avatar-${AVATAR_TONES[index % AVATAR_TONES.length]}`}
                            aria-hidden="true"
                        >
                            {avatar.initials}
                        </span>
                    ))}
                    {summary && (
                        <span className="admin-card-members">
                            {summary.memberCount} {summary.memberCount === 1 ? "member" : "members"}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    className="admin-card-open"
                    aria-label={`Open ${project.project_name}`}
                    onClick={() => onOpen(project)}
                >
                    Open project
                    <Icon name="arrowRight" size={14} />
                </button>
            </footer>
        </article>
    );
}

export default AdminProjectCard;
