import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileInvoice } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

export default function MobileHeader() {
  return (
    <header className="mobile-header">
      <Link to="/" className="mobile-brand">
        <span className="mobile-logo">
          <FontAwesomeIcon icon={faFileInvoice} />
        </span>
        <span>Invoice App</span>
      </Link>
      <Link to="/clients" className="mobile-header-btn">
        Add Client
      </Link>
    </header>
  );
}
