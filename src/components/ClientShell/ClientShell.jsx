import Icon from "../Icons/Icons";
import { NotificationBell } from "../NotificationCenter/NotificationCenter";
import QuantixLogo from "../QuantixLogo/QuantixLogo";
import { useNotifications } from "../../hooks/useNotifications";
import "./ClientShell.css";

/*
 * The frame around every Client page: the navy sidebar (Overview, Settings), a navy
 * header with the notification bell, and the page content. The header shows `title`,
 * with an optional `badge` pill beside it and a back arrow when `onBack` is given
 * (`upperTitle` prints project names in capitals, as on the project pages).
 */
function ClientShell({
    profile,
    title,
    upperTitle = false,
    badge,
    onBack,
    backLabel = "Back to all projects",
    activeNav = "overview",
    onOpenOverview,
    onOpenSettings,
    onSignOut,
    children
}) {
    const notifications = useNotifications();
    const initial = (profile.user_pref_name || profile.user_first_name || "?")[0].toUpperCase();

    return (
        <div className="cs-shell">
            <aside className="cs-sidebar">
                <QuantixLogo variant="client" />

                <nav className="cs-nav" aria-label="Workspace">
                    <button
                        type="button"
                        className={`cs-link${activeNav === "overview" ? " is-active" : ""}`}
                        aria-current={activeNav === "overview" ? "page" : undefined}
                        onClick={onOpenOverview}
                    >
                        <Icon name="grid" size={20} />
                        Overview
                    </button>
                    <button
                        type="button"
                        className={`cs-link${activeNav === "settings" ? " is-active" : ""}`}
                        aria-current={activeNav === "settings" ? "page" : undefined}
                        onClick={onOpenSettings}
                    >
                        <Icon name="gear" size={20} />
                        Settings
                    </button>
                </nav>

                <div className="cs-bottom">
                    <div className="cs-role-card">
                        <small>Workspace</small>
                        <strong>Client role</strong>
                        <p>Follow your project and current sprint progress.</p>
                    </div>
                    <button type="button" className="cs-signout" onClick={onSignOut}>
                        <Icon name="signOut" size={20} />
                        Sign out
                    </button>
                </div>
            </aside>

            <div className="cs-main">
                <header className="cs-header">
                    <div className={`cs-heading${upperTitle ? " is-upper" : ""}`}>
                        {onBack && (
                            <button type="button" className="cs-back" aria-label={backLabel} onClick={onBack}>
                                <Icon name="arrowLeft" size={20} />
                            </button>
                        )}
                        <h1>{title}</h1>
                        {badge && <span className="cs-badge">{badge}</span>}
                    </div>

                    <div className="cs-header-right">
                        <NotificationBell notifications={notifications} />
                        <div className="cs-chip">
                            <span className="cs-avatar" aria-hidden="true">{initial}</span>
                            Client
                        </div>
                    </div>
                </header>

                <main className="cs-content">{children}</main>
            </div>
        </div>
    );
}

export default ClientShell;
