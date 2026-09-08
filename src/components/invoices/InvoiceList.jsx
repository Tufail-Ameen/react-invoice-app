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
      <div className="hidden md:block">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="invoice-row datalist mt-3 grid cursor-pointer grid-cols-12 items-center py-3 pl-3"
            onClick={() => openInvoice(invoice)}
          >
            <div className="position-table table-text-size col-span-2">
              <span className="hash-clr">#</span>
              {invoice.number}
            </div>
            <div className="position-table table-text-size textcklr col-span-2">
              {invoice.issueDate}
            </div>
            <div className="table-text-size textcklr col-span-3">
              {invoice.clientName}
            </div>
            <div className="price col-span-2">
              {formatAmount(invoice.currency, invoice.total)}
            </div>
            <div className="position-table-btn col-span-2 p-0">
              <StatusBadge status={invoice.status} />
            </div>
            <div className="position-table goicon-position col-span-1 m-0 p-0">
              <span className="down-icon goicon">
                <FontAwesomeIcon icon={faChevronRight} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="block md:hidden">
        {invoices.map((invoice) => (
          <InvoiceCard key={invoice.id} invoice={invoice} />
        ))}
      </div>
    </>
  );
}
