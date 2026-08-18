import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { formatAmount } from "../../utils/invoice";
import EmptyState from "../ui/EmptyState";
import StatusBadge from "../ui/StatusBadge";
import InvoiceCard from "./InvoiceCard";

export default function InvoiceList({ invoices }) {
  const navigate = useNavigate();

  const openInvoice = (invoice, fallbackIndex) => {
    const index = invoice.originalIndex ?? fallbackIndex;
    localStorage.setItem("Index", index);
    navigate(`/invoices/${index}`);
  };

  if (!invoices.length) {
    return (
      <EmptyState
        title="No invoices yet"
        message="Create a new invoice to get started."
      />
    );
  }

  return (
    <>
      <div className="d-none d-md-block">
        {invoices.map((invoice, index) => (
          <div
            key={`${invoice.id}-${index}`}
            className="row mt-3 py-3 ps-3 invoice-row datalist cursor"
            onClick={() => openInvoice(invoice, index)}
          >
            <div className="col-md-1 position-table table-text-size">
              <span className="hash-clr">#</span>
              {invoice.id}
            </div>
            <div className="col-md-3 position-table table-text-size textcklr">
              {invoice.date}
            </div>
            <div className="col-md-3 table-text-size textcklr">{invoice.name}</div>
            <div className="col-md-2 price">
              {formatAmount(invoice.currency, invoice.total)}
            </div>
            <div className="col-md-2 position-table-btn p-0">
              <StatusBadge status={invoice.btnCP} />
            </div>
            <div className="col-md-1 p-0 m-0 position-table goicon-position">
              <span className="down-icon goicon">
                <FontAwesomeIcon icon={faChevronRight} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="d-block d-md-none">
        {invoices.map((invoice, index) => (
          <InvoiceCard
            key={`${invoice.id}-${index}`}
            invoice={invoice}
            index={index}
          />
        ))}
      </div>
    </>
  );
}
