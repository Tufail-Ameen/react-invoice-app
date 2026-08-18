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
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="hash-clr fw-semibold">#{invoice.id}</span>
        <StatusBadge status={invoice.btnCP} compact />
      </div>
      <p className="mb-1">
        <strong className="text-accent">Client:</strong>
        <span className="ms-2">{invoice.name}</span>
      </p>
      <div className="row">
        <div className="col-6">
          <strong className="text-accent">Date:</strong>
          <span className="ms-2">{invoice.date}</span>
        </div>
        <div className="col-6">
          <strong className="text-accent">Amount:</strong>
          <span className="ms-2 fw-semibold">
            {formatAmount(invoice.currency, invoice.total)}
          </span>
        </div>
      </div>
      <div className="text-end mt-2">
        <span className="down-icon goicon">
          <FontAwesomeIcon icon={faChevronRight} />
        </span>
      </div>
    </div>
  );
}
