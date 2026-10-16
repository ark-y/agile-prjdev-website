import Icon from "../../components/Icons/Icons";
import WorkspaceShell from "../../components/WorkspaceShell/WorkspaceShell";
import { useNotifications } from "../../hooks/useNotifications";
import { useProjectDates } from "../../hooks/useProjectDates";
import "./ProjectsLanding.css";

// The landing page for Admins and Developers. Only Admins can add or delete projects.
function ProjectsLanding({
    profile,
    projects = [],
    onOpenProject,
    onAddProject,
    onDeleteProject,
    onOpenSettings,
    onSignOut
}) {
    const isAdmin = profile.role_name === "Admin";
    const notifications = useNotifications();
    const describeDates = useProjectDates(projects);

    const ownerName = isAdmin ? "Admin" : profile.user_pref_name || profile.user_first_name || "My";

    return (
        <WorkspaceShell
            profile={profile}
            notifications={notifications}
            title={`${ownerName}'s dashboard`}
            onOpenProjects={undefined}
            onOpenSettings={onOpenSettings}
            onSignOut={onSignOut}
        >
            <section className="pl-intro">
                <h1>Projects</h1>
                <p>
                    {isAdmin
                        ? "Manage active initiatives and create new workspaces from a single workspace."
                        : "Pick up your active initiatives from a single workspace."}
                </p>
            </section>

            <ul className="pl-grid" aria-label="Projects">
                {projects.map((project) => (
                    <li className="pl-item" key={project.project_id}>
                        <button
                            type="button"
                            className="pl-card"
                            aria-label={`Open ${project.project_name}`}
                            onClick={() => onOpenProject(project)}
                        >
                            <span className="pl-card-name">{project.project_name}</span>
                            <span className="pl-card-label">Project dates</span>
                            <span className="pl-card-dates">{describeDates(project)}</span>
                        </button>
                        {isAdmin && (
                            <button
                                type="button"
                                className="pl-card-delete"
                                aria-label={`Delete ${project.project_name}`}
                                onClick={() => onDeleteProject(project)}
                            >
                                <Icon name="trash" size={15} />
                            </button>
                        )}
                    </li>
                ))}

                {isAdmin && (
                    <li className="pl-item">
                        <button type="button" className="pl-add" onClick={onAddProject}>
                            <Icon name="plus" size={30} />
                            Add project
                        </button>
                    </li>
                )}
            </ul>

            {!projects.length && !isAdmin && (
                <p className="pl-empty">You haven't been added to any projects yet.</p>
            )}
        </WorkspaceShell>
    );
}

export default ProjectsLanding;
