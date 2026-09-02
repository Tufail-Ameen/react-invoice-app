import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { formatAmount } from "../../utils/invoice";
import EmptyState from "../ui/EmptyState";
import StatusBadge from "../ui/StatusBadge";
import InvoiceCard from "./InvoiceCard";

export default function InvoiceList({ invoices }) {
  const navigate = useNavigate();

  const openInvoice = (invoice) => {
    navigate(`/invoices/${invoice.id}`);
  };

  if (!invoices.length) {
    return (
      <EmptyState title="No invoices yet" message="Create a new invoice to get started." />
    );
  }

  return (
    <>
      <div className="d-none d-md-block">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="row mt-3 py-3 ps-3 invoice-row datalist cursor"
            onClick={() => openInvoice(invoice)}
          >
            <div className="col-md-2 position-table table-text-size">
              <span className="hash-clr">#</span>
              {invoice.number}
            </div>
            <div className="col-md-2 position-table table-text-size textcklr">
              {invoice.issueDate}
            </div>
            <div className="col-md-3 table-text-size textcklr">
              {invoice.clientName}
            </div>
            <div className="col-md-2 price">
              {formatAmount(invoice.currency, invoice.total)}
            </div>
            <div className="col-md-2 position-table-btn p-0">
              <StatusBadge status={invoice.status} />
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
        {invoices.map((invoice) => (
          <InvoiceCard key={invoice.id} invoice={invoice} />
        ))}
      </div>
    </>
  );
}
