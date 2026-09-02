import { faBoxesStacked, faFileInvoice, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const links = [
  { to: "/", label: "Invoices", icon: faFileInvoice, end: true },
  { to: "/clients", label: "Clients", icon: faUsers },
  { to: "/stock", label: "Products & Stock", icon: faBoxesStacked },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "??";

  return (
    <aside className="app-sidebar">
      <NavLink to="/" className="sidebar-logo" aria-label="Go to invoices">
        <FontAwesomeIcon icon={faFileInvoice} />
      </NavLink>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <FontAwesomeIcon icon={link.icon} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-profile">
        <button
          type="button"
          className="sidebar-avatar border-0"
          title={user ? `${user.fullName} — Logout` : "Logout"}
          onClick={() => logout()}
        >
          {initials}
        </button>
      </div>
    </aside>
  );
}
