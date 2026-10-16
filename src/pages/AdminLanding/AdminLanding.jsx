import { useEffect, useMemo, useState } from "react";
import Icon from "../../components/Icons/Icons";
import { NotificationPanel } from "../../components/NotificationCenter/NotificationCenter";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useNotifications } from "../../hooks/useNotifications";
import { fetchProjectSummaryData } from "../../services/projectServices";
import AdminProjectCard from "./AdminProjectCard";
import {
    buildProjectSummaries,
    STATUS_COMPLETED,
    STATUS_IN_PROGRESS,
    STATUS_PLANNING
} from "./projectSummary";
import "./AdminLanding.css";

const FILTERS = [
    { key: "all", label: "All projects", matches: () => true },
    { key: "progress", label: "In progress", matches: (summary) => summary?.status === STATUS_IN_PROGRESS },
    { key: "planning", label: "Planning", matches: (summary) => summary?.status === STATUS_PLANNING },
    { key: "completed", label: "Completed", matches: (summary) => summary?.status === STATUS_COMPLETED },
    { key: "overdue", label: "Overdue", matches: (summary) => Boolean(summary?.overdue), alert: true }
];

function getFirstName(profile) {
    return profile.user_pref_name || profile.user_first_name || "there";
}

function getFullName(profile) {
    return profile.user_pref_name
        || `${profile.user_first_name || ""} ${profile.user_last_name || ""}`.trim()
        || profile.user_email;
}

function getInitials(profile) {
    const first = profile.user_pref_name || profile.user_first_name || "";
    const last = profile.user_pref_name ? "" : profile.user_last_name || "";
    return ((first[0] || "") + (last[0] || "")).toUpperCase() || "?";
}

function describeActiveSprints(names) {
    if (!names.length) {
        return "No sprints running right now";
    }
    if (names.length <= 2) {
        return names.join(" and ");
    }
    return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}

function AdminLanding({
    profile,
    projects = [],
    onOpenProject,
    onAddProject,
    onDeleteProject,
    onOpenSettings,
    onSignOut
}) {
    const { notifications, unreadCount, error: notificationError, markRead } = useNotifications();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [filterKey, setFilterKey] = useState("all");
    const [query, setQuery] = useState("");
    const [summaryData, setSummaryData] = useState(null);
    const [summaryError, setSummaryError] = useState("");

    useEffect(() => {
        let active = true;

        setSummaryError("");
        fetchProjectSummaryData()
            .then((data) => {
                if (active) {
                    setSummaryData(data);
                }
            })
            .catch((loadError) => {
                if (active) {
                    setSummaryError(loadError.message || "Could not load project progress.");
                }
            });

        return () => {
            active = false;
        };
    }, [projects]);

    const summaries = useMemo(
        () => (summaryData ? buildProjectSummaries({ projects, ...summaryData }) : {}),
        [projects, summaryData]
    );

    const summaryState = summaryError && !summaryData ? "error" : summaryData ? "ready" : "loading";
    const filter = FILTERS.find((item) => item.key === filterKey);
    const search = query.trim().toLowerCase();

    const visibleProjects = projects.filter((project) => {
        if (!filter.matches(summaries[project.project_id])) {
            return false;
        }
        return !search
            || project.project_name.toLowerCase().includes(search)
            || (project.project_desc || "").toLowerCase().includes(search);
    });

    const activeSprintProjects = projects.filter((project) => summaries[project.project_id]?.isActive);

    return (
        <div className="admin-shell">
            <Sidebar
                roleLabel="Administrator"
                accountLabel="Admin account"
                userName={getFullName(profile)}
                userInitials={getInitials(profile)}
                unreadCount={unreadCount}
                notificationsOpen={notificationsOpen}
                onToggleNotifications={() => setNotificationsOpen((open) => !open)}
                onOpenSettings={onOpenSettings}
                onSignOut={onSignOut}
            />

            <div className="admin-main">
                <header className="admin-topbar">
                    <nav className="admin-breadcrumb" aria-label="Breadcrumb">
                        <span>Admin workspace</span>
                        <span aria-hidden="true">/</span>
                        <span aria-current="page">Projects</span>
                    </nav>

                    <div className="admin-bell">
                        <button
                            type="button"
                            className="admin-bell-button"
                            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                            aria-expanded={notificationsOpen}
                            onClick={() => setNotificationsOpen((open) => !open)}
                        >
                            <Icon name="bell" size={17} />
                            {unreadCount > 0 && <span className="admin-bell-dot" aria-hidden="true" />}
                        </button>

                        {notificationsOpen && (
                            <NotificationPanel
                                notifications={notifications}
                                error={notificationError}
                                onMarkRead={markRead}
                                onClose={() => setNotificationsOpen(false)}
                            />
                        )}
                    </div>
                </header>

                <main className="admin-content">
                    <section className="admin-hero">
                        <div>
                            <h1>Your projects, moving forward.</h1>
                            <p>
                                Welcome back, {getFirstName(profile)}. Keep people, priorities and progress in view.
                            </p>
                        </div>
                        <button type="button" className="admin-new-project" onClick={onAddProject}>
                            <Icon name="plus" size={14} />
                            New project
                        </button>
                    </section>

                    <section className="admin-stats" aria-label="Workspace summary">
                        <div className="admin-stat">
                            <span className="admin-stat-icon"><Icon name="folder" size={18} /></span>
                            <div>
                                <p className="admin-stat-line">
                                    <strong>{projects.length}</strong> {projects.length === 1 ? "Project" : "Projects"}
                                </p>
                                <p className="admin-stat-note">One workspace. A shared direction.</p>
                            </div>
                        </div>
                        <div className="admin-stat">
                            <span className="admin-stat-icon"><Icon name="sprint" size={18} /></span>
                            <div>
                                <p className="admin-stat-line">
                                    <strong>{summaryState === "ready" ? activeSprintProjects.length : "–"}</strong>
                                    {" "}Active sprints
                                </p>
                                <p className="admin-stat-note">
                                    {summaryState === "ready"
                                        ? describeActiveSprints(activeSprintProjects.map((project) => project.project_name))
                                        : summaryState === "error" ? "Sprint progress is unavailable" : "Loading sprints..."}
                                </p>
                            </div>
                        </div>
                        <div className="admin-stat">
                            <span className="admin-stat-icon"><Icon name="bell" size={18} /></span>
                            <div>
                                <p className="admin-stat-line">
                                    <strong>{unreadCount}</strong> Unread updates
                                </p>
                                <p className="admin-stat-note">
                                    {unreadCount ? "Catch up in Notifications" : "You're all caught up"}
                                </p>
                            </div>
                        </div>
                    </section>

                    {summaryError && (
                        <p className="admin-notice" role="alert">{summaryError}</p>
                    )}

                    <section className="admin-toolbar">
                        <div className="admin-filters" role="group" aria-label="Filter projects">
                            {FILTERS.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    className={[
                                        "admin-filter",
                                        item.alert ? "admin-filter-alert" : "",
                                        item.key === filterKey ? "is-selected" : ""
                                    ].filter(Boolean).join(" ")}
                                    aria-pressed={item.key === filterKey}
                                    onClick={() => setFilterKey(item.key)}
                                >
                                    {item.label}
                                    {(item.key === "all" || summaryData) && (
                                        <span>
                                            {projects.filter((project) => item.matches(summaries[project.project_id])).length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <label className="admin-search">
                            <Icon name="search" size={14} />
                            <input
                                type="search"
                                placeholder="Search projects"
                                aria-label="Search projects"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </label>
                    </section>

                    {visibleProjects.length ? (
                        <section className="admin-grid" aria-label="Projects">
                            {visibleProjects.map((project) => (
                                <AdminProjectCard
                                    key={project.project_id}
                                    project={project}
                                    summary={summaries[project.project_id]}
                                    summaryState={summaryState}
                                    onOpen={onOpenProject}
                                    onDelete={onDeleteProject}
                                />
                            ))}
                        </section>
                    ) : (
                        <section className="admin-empty">
                            {projects.length ? (
                                <p>No projects match your filters.</p>
                            ) : (
                                <>
                                    <p>No projects yet. Create your first project to get your team moving.</p>
                                    <button type="button" className="admin-new-project" onClick={onAddProject}>
                                        <Icon name="plus" size={14} />
                                        New project
                                    </button>
                                </>
                            )}
                        </section>
                    )}
                </main>

                <footer className="admin-footer">
                    <span>&copy; 2026 Quantix services</span>
                </footer>
            </div>
        </div>
    );
}

export default AdminLanding;
