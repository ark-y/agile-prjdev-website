import { useEffect, useMemo, useState } from "react";
import Icon from "../../components/Icons/Icons";
import WorkspaceShell from "../../components/WorkspaceShell/WorkspaceShell";
import { useNotifications } from "../../hooks/useNotifications";
import { fetchSprintDates } from "../../services/projectServices";
import { formatProjectDates, projectDateRange } from "../../utils/projectDates";
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
    const [sprintDates, setSprintDates] = useState(null);

    useEffect(() => {
        let active = true;

        fetchSprintDates()
            .then((rows) => {
                if (active) {
                    setSprintDates(rows);
                }
            })
            .catch(() => {
                if (active) {
                    setSprintDates(undefined);
                }
            });

        return () => {
            active = false;
        };
    }, [projects]);

    const datesByProject = useMemo(() => {
        const byProject = {};
        for (const sprint of sprintDates || []) {
            (byProject[sprint.project_id] ??= []).push(sprint);
        }
        return byProject;
    }, [sprintDates]);

    function describeDates(project) {
        if (sprintDates === undefined) {
            return "Dates unavailable";
        }
        if (sprintDates === null) {
            return "–";
        }
        return formatProjectDates(projectDateRange(datesByProject[project.project_id] || []));
    }

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
