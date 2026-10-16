import Icon from "../Icons/Icons";
import QuantixLogo from "../QuantixLogo/QuantixLogo";
import "./Sidebar.css";

function Sidebar({
    roleLabel,
    accountLabel,
    userName,
    userInitials,
    unreadCount = 0,
    notificationsOpen = false,
    onToggleNotifications,
    onOpenSettings,
    onSignOut
}) {
    return (
        <aside className="sidebar">
            <QuantixLogo compact />

            <div className="sidebar-workspace">
                <p className="sidebar-eyebrow">Your workspace</p>
                <p className="sidebar-role">{roleLabel}</p>
            </div>

            <nav className="sidebar-nav" aria-label="Workspace">
                <button type="button" className="sidebar-link sidebar-link-active" aria-current="page">
                    <Icon name="grid" />
                    Projects
                </button>
                <button
                    type="button"
                    className="sidebar-link"
                    aria-expanded={notificationsOpen}
                    onClick={onToggleNotifications}
                >
                    <Icon name="bell" />
                    Notifications
                    {unreadCount > 0 && (
                        <span className="sidebar-badge" aria-label={`${unreadCount} unread`}>
                            {unreadCount}
                        </span>
                    )}
                </button>
                <button type="button" className="sidebar-link" onClick={onOpenSettings}>
                    <Icon name="gear" />
                    Settings
                </button>
            </nav>

            <div className="sidebar-note">
                <p className="sidebar-note-title">A little clarity. A lot of momentum.</p>
                <p className="sidebar-note-body">People, priorities and sprints. Better, together.</p>
            </div>

            <div className="sidebar-user">
                <span className="sidebar-avatar" aria-hidden="true">{userInitials}</span>
                <div>
                    <p className="sidebar-user-name">{userName}</p>
                    <p className="sidebar-user-role">{accountLabel}</p>
                </div>
            </div>

            <button type="button" className="sidebar-signout" onClick={onSignOut}>
                <Icon name="signOut" />
                Sign out
            </button>
        </aside>
    );
}

export default Sidebar;
