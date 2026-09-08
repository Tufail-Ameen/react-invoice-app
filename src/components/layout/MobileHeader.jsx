import { faFileInvoice } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { getNavPageTitle } from "./navLinks";

export default function MobileHeader() {
  const { pathname } = useLocation();
  const { user, activeBusiness } = useAuth();
  const pageTitle = getNavPageTitle(pathname);

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "??";

  return (
    <header className="mobile-header md:hidden">
      <Link to="/invoices" className="mobile-brand">
        <span className="mobile-logo">
          <FontAwesomeIcon icon={faFileInvoice} />
        </span>
        <span className="mobile-brand-copy">
          <span className="mobile-brand-name">{activeBusiness?.name || "Invoice App"}</span>
          <span className="mobile-brand-page">{pageTitle}</span>
        </span>
      </Link>
      <span className="mobile-avatar" aria-hidden="true">
        {initials}
      </span>
    </header>
  );
}
