import ClientShell from "../../components/ClientShell/ClientShell";
import Icon from "../../components/Icons/Icons";
import { useProjectDates } from "../../hooks/useProjectDates";
import "./ClientLanding.css";

// A folder with a link badge, shown while no project has been shared with the client.
function SharedFolderArt() {
    return (
        <svg className="cl-art" viewBox="0 0 192 162" aria-hidden="true" focusable="false">
            <circle cx="97" cy="81" r="75" fill="#FAF8F5" />
            <rect x="16" y="41" width="70" height="31" rx="8" fill="#678EB5" />
            <rect x="16" y="65" width="158" height="87" rx="8" fill="#678EB5" />
            <rect x="49" y="52" width="89" height="45" rx="4" fill="#fff" />
            <rect x="66.5" y="68" width="47" height="4.5" rx="2.25" fill="#D9E5F1" />
            <rect x="66.5" y="81" width="35" height="4.5" rx="2.25" fill="#D9E5F1" />
            <circle cx="168" cy="130" r="22" fill="#E9AB9A" />
            <g
                transform="translate(158.4 120.4) scale(0.8)"
                fill="none"
                stroke="#25395C"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </g>
        </svg>
    );
}

/*
 * The Client landing page: every project the client has been added to, or a
 * friendly empty state when nothing has been shared yet.
 */
function ClientLanding({ profile, projects = [], onOpenProject, onOpenSettings, onSignOut }) {
    const describeDates = useProjectDates(projects);
    const hasProjects = projects.length > 0;

    return (
        <ClientShell
            profile={profile}
            title="Client workspace"
            activeNav="overview"
            onOpenOverview={undefined}
            onOpenSettings={onOpenSettings}
            onSignOut={onSignOut}
        >
            <section className="cl-intro">
                <h1>Welcome to your workspace</h1>
                <p>
                    {hasProjects
                        ? "Pick a project to follow its progress and current sprint."
                        : "Your shared projects will appear here."}
                </p>
            </section>

            {hasProjects ? (
                <ul className="cl-grid" aria-label="Your projects">
                    {projects.map((project) => (
                        <li key={project.project_id}>
                            <button
                                type="button"
                                className="cl-card"
                                aria-label={`Open ${project.project_name}`}
                                onClick={() => onOpenProject(project)}
                            >
                                <span className="cl-card-name">{project.project_name}</span>
                                <span className="cl-card-label">Project dates</span>
                                <span className="cl-card-dates">{describeDates(project)}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <section className="cl-empty" aria-label="No projects shared">
                    <SharedFolderArt />
                    <h2>
                        No project has been shared with you yet.
                        <br />
                        Get started now!
                    </h2>
                    <p>An admin needs to share a project with your account. Contact your admin to get started.</p>
                    {/* Contact admin is not wired up yet: it is only a button for now. */}
                    <button type="button" className="cl-contact">
                        <Icon name="chat" size={18} />
                        Contact admin
                    </button>
                </section>
            )}
        </ClientShell>
    );
}

export default ClientLanding;
