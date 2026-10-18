import Icon from "../Icons/Icons";
import QuantixLogo from "../QuantixLogo/QuantixLogo";
import "./Sidebar.css";

function Sidebar({ active = "projects", extra, onOpenProjects, onOpenSettings, onSignOut }) {
    return (
        <aside className="sidebar">
            <QuantixLogo variant="stacked" />

            <nav className="sidebar-nav" aria-label="Workspace">
                <button
                    type="button"
                    className={`sidebar-link${active === "projects" ? " sidebar-link-active" : ""}`}
                    aria-current={active === "projects" ? "page" : undefined}
                    onClick={onOpenProjects}
                >
                    <Icon name="grid" size={18} />
                    Projects
                </button>
                <button
                    type="button"
                    className={`sidebar-link${active === "settings" ? " sidebar-link-active" : ""}`}
                    aria-current={active === "settings" ? "page" : undefined}
                    onClick={onOpenSettings}
                >
                    <Icon name="gear" size={18} />
                    Settings
                </button>
            </nav>

            <div className="sidebar-bottom">
                {extra}
                <button type="button" className="sidebar-signout" onClick={onSignOut}>
                    <Icon name="signOut" size={18} />
                    Sign out
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
