import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import BusinessSwitcher from "./BusinessSwitcher";
import { getNavPageTitle } from "./navLinks";

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout, activeBusiness } = useAuth();
  const pageTitle = getNavPageTitle(pathname);

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "??";

  return (
    <header className="app-navbar hidden md:flex">
      <div className="navbar-start">
        <p className="navbar-eyebrow">{activeBusiness?.name || "Dashboard"}</p>
        <h1 className="navbar-title">{pageTitle}</h1>
      </div>

      <div className="navbar-end">
        <div className="navbar-business-desktop hidden lg:block">
          <BusinessSwitcher />
        </div>

        <div className="navbar-user">
          <span className="navbar-avatar">{initials}</span>
          <div className="navbar-user-meta">
            <span className="navbar-user-name">{user?.fullName || "User"}</span>
            <span className="navbar-user-role">{user?.role?.name || "Member"}</span>
          </div>
        </div>

        <button type="button" className="navbar-logout-btn" onClick={() => logout()}>
          <FontAwesomeIcon icon={faRightFromBracket} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
