import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxesStacked,
  faFileInvoice,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Invoices", icon: faFileInvoice, end: true },
  { to: "/clients", label: "Clients", icon: faUsers },
  { to: "/users", label: "Users", icon: faUser },
  { to: "/stock", label: "Stock", icon: faBoxesStacked },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            `bottom-nav-link ${isActive ? "active" : ""}`
          }
        >
          <FontAwesomeIcon icon={link.icon} />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
