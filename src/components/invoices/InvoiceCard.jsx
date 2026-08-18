import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { formatAmount } from "../../utils/invoice";
import StatusBadge from "../ui/StatusBadge";

export default function InvoiceCard({ invoice, index }) {
  const navigate = useNavigate();

  return (
    <div
      className="invoice-card"
      onClick={() => {
        const invoiceIndex = invoice.originalIndex ?? index;
        localStorage.setItem("Index", invoiceIndex);
        navigate(`/invoices/${invoiceIndex}`);
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="hash-clr fw-semibold">#{invoice.id}</span>
        <StatusBadge status={invoice.btnCP} compact />
      </div>
      <p className="mb-2 fw-semibold">{invoice.name}</p>
      <div className="d-flex justify-content-between align-items-end">
        <div>
          <div className="textcklr mb-1 table-text-size">
            {invoice.date}
          </div>
          <div className="price">{formatAmount(invoice.currency, invoice.total)}</div>
        </div>
        <span className="down-icon">
          <FontAwesomeIcon icon={faChevronRight} />
        </span>
      </div>
    </div>
  );
}
