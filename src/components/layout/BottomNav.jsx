import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavLink } from "react-router-dom";
import { navLinks } from "./navLinks";

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {navLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => `bottom-nav-link ${isActive ? "active" : ""}`}
        >
          <FontAwesomeIcon icon={link.icon} />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
