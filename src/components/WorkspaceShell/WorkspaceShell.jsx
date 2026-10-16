import { Fragment } from "react";
import { NotificationBell } from "../NotificationCenter/NotificationCenter";
import Sidebar from "../Sidebar/Sidebar";
import "./WorkspaceShell.css";

function getInitial(profile) {
    const name = profile.user_pref_name || profile.user_first_name || "";
    return (name[0] || "?").toUpperCase();
}

/*
 * The frame around the Admin and Developer pages: sidebar, a header with the
 * notification bell, and the page content. Give it a `title` for the dashboard
 * header (landing page) or a `breadcrumb` for pages inside a project.
 * `notifications` is the result of useNotifications().
 */
function WorkspaceShell({
    profile,
    notifications,
    title,
    breadcrumb,
    onOpenProjects,
    onOpenSettings,
    onSignOut,
    children
}) {
    return (
        <div className="ws-shell">
            <Sidebar
                onOpenProjects={onOpenProjects}
                onOpenSettings={onOpenSettings}
                onSignOut={onSignOut}
            />

            <div className="ws-main">
                {breadcrumb ? (
                    <header className="ws-topbar ws-topbar-crumbs">
                        <nav className="ws-breadcrumb" aria-label="Breadcrumb">
                            {breadcrumb.map((crumb, index) => {
                                const isCurrent = index === breadcrumb.length - 1;
                                return (
                                    <Fragment key={`${index}-${crumb.label}`}>
                                        {index > 0 && <span aria-hidden="true">/</span>}
                                        {crumb.onClick && !isCurrent ? (
                                            <button type="button" onClick={crumb.onClick}>{crumb.label}</button>
                                        ) : (
                                            <span aria-current={isCurrent ? "page" : undefined}>{crumb.label}</span>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </nav>
                        <NotificationBell notifications={notifications} />
                    </header>
                ) : (
                    <header className="ws-topbar ws-topbar-card">
                        <div className="ws-owner">
                            <span className="ws-avatar" aria-hidden="true">{getInitial(profile)}</span>
                            <p className="ws-title">{title}</p>
                        </div>
                        <NotificationBell notifications={notifications} />
                    </header>
                )}

                <main className="ws-content">{children}</main>
            </div>
        </div>
    );
}

export default WorkspaceShell;
