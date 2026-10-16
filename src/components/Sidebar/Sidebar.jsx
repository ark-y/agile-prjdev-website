import Icon from "../Icons/Icons";
import QuantixLogo from "../QuantixLogo/QuantixLogo";
import "./Sidebar.css";

function Sidebar({ onOpenProjects, onOpenSettings, onSignOut }) {
    return (
        <aside className="sidebar">
            <QuantixLogo variant="stacked" />

            <nav className="sidebar-nav" aria-label="Workspace">
                <button
                    type="button"
                    className="sidebar-link sidebar-link-active"
                    aria-current="page"
                    onClick={onOpenProjects}
                >
                    <Icon name="grid" size={18} />
                    Projects
                </button>
                <button type="button" className="sidebar-link" onClick={onOpenSettings}>
                    <Icon name="gear" size={18} />
                    Settings
                </button>
            </nav>

            <button type="button" className="sidebar-signout" onClick={onSignOut}>
                <Icon name="signOut" size={18} />
                Sign out
            </button>
        </aside>
    );
}

export default Sidebar;
