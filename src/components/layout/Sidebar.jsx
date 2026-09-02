import {
  faBars,
  faFileInvoice,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { navLinks } from "./navLinks";
import { useSidebar } from "./SidebarContext";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { collapsed, toggleSidebar } = useSidebar();
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "??";

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-brand" aria-label="Go to invoices">
          <span className="sidebar-brand-icon">
            <FontAwesomeIcon icon={faFileInvoice} />
          </span>
          <span className="sidebar-brand-copy">
            <span className="sidebar-brand-name">Invoice App</span>
            <span className="sidebar-brand-tagline">Business Manager</span>
          </span>
        </NavLink>

        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <p className="sidebar-section-label">Main Menu</p>
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            title={collapsed ? link.label : undefined}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <span className="sidebar-link-icon">
              <FontAwesomeIcon icon={link.icon} />
            </span>
            <span className="sidebar-link-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-profile">
        <div className="sidebar-profile-card" title={collapsed ? user?.fullName : undefined}>
          <span className="sidebar-avatar">{initials}</span>
          <div className="sidebar-profile-meta">
            <span className="sidebar-profile-name">{user?.fullName || "User"}</span>
            <span className="sidebar-profile-email">{user?.email || "Signed in"}</span>
          </div>
        </div>
        <button
          type="button"
          className="sidebar-logout-btn"
          title="Sign out"
          onClick={() => logout()}
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
