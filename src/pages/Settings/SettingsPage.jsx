import { useState } from "react";
import ClientShell from "../../components/ClientShell/ClientShell";
import WorkspaceShell from "../../components/WorkspaceShell/WorkspaceShell";
import PeopleTab from "./PeopleTab";
import ProfileTab from "./ProfileTab";
import ProjectsTab from "./ProjectsTab";
import SecurityTab from "./SecurityTab";
import "./Settings.css";

const ADMIN_TABS = [
    { key: "developers", label: "Developers", subtitle: "Add developers to a project or create a new developer account." },
    { key: "clients", label: "Clients", subtitle: "Share a project with an existing client or create a new client account." },
    { key: "projects", label: "Projects", subtitle: "Create a project workspace and give it a clear, recognizable name." },
    { key: "security", label: "Security", subtitle: "Keep your admin account secure by updating your password." }
];

const MEMBER_TABS = [
    { key: "profile", label: "Profile", subtitle: "Update the name your team sees." },
    { key: "security", label: "Security", subtitle: "Keep your account secure by updating your password." }
];

/*
 * Settings as a page. Admins manage people and projects; Developers and Clients
 * can only change their own name and password. Clients get it inside their own
 * navy workspace frame, with Overview taking them back to their projects.
 */
function SettingsPage({
    profile,
    projects = [],
    onOpenProjects,
    onSignOut,
    onCreateProject,
    onRenameProject,
    onProfileUpdated
}) {
    const isAdmin = profile.role_name === "Admin";
    const tabs = isAdmin ? ADMIN_TABS : MEMBER_TABS;
    const [tabKey, setTabKey] = useState(tabs[0].key);
    const tab = tabs.find((item) => item.key === tabKey);
    const initial = (profile.user_pref_name || profile.user_first_name || "?")[0].toUpperCase();

    const content = (
        <>
            <section className="set-intro">
                <h1>Settings</h1>
                <p>{tab.subtitle}</p>
            </section>

            <div className="set-tabs" role="tablist" aria-label="Settings sections" style={{ "--tab-count": tabs.length }}>
                {tabs.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={item.key === tabKey}
                        className={item.key === tabKey ? "is-selected" : ""}
                        onClick={() => setTabKey(item.key)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div role="tabpanel" aria-label={tab.label}>
                {tabKey === "developers" && <PeopleTab key="Developer" role="Developer" projects={projects} />}
                {tabKey === "clients" && <PeopleTab key="Client" role="Client" projects={projects} />}
                {tabKey === "projects" && (
                    <ProjectsTab projects={projects} onCreateProject={onCreateProject} onRenameProject={onRenameProject} />
                )}
                {tabKey === "profile" && <ProfileTab profile={profile} onProfileUpdated={onProfileUpdated} />}
                {tabKey === "security" && <SecurityTab />}
            </div>
        </>
    );

    if (profile.role_name === "Client") {
        return (
            <ClientShell
                profile={profile}
                title="Settings"
                activeNav="settings"
                onOpenOverview={onOpenProjects}
                onSignOut={onSignOut}
            >
                {content}
            </ClientShell>
        );
    }

    return (
        <WorkspaceShell
            profile={profile}
            activeNav="settings"
            breadcrumb={[{ label: isAdmin ? "Admin workspace" : "Workspace" }, { label: "Settings" }]}
            breadcrumbStyle="card"
            headerRight={
                <div className="ws-chip">
                    <span className="ws-avatar" aria-hidden="true">{initial}</span>
                    {profile.role_name}
                </div>
            }
            onOpenProjects={onOpenProjects}
            onSignOut={onSignOut}
        >
            {content}
        </WorkspaceShell>
    );
}

export default SettingsPage;
