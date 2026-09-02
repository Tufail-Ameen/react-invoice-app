import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { toast } from "react-toastify";
import InvoiceForm from "../components/invoices/InvoiceForm";
import InvoiceList from "../components/invoices/InvoiceList";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import { useGetInvoicesQuery } from "../services/invoiceApi";

export default function InvoicesPage() {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const params = { per_page: 100 };
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading, isError, error, refetch } = useGetInvoicesQuery(params);
  const invoices = data?.invoices || [];

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Failed to load invoices"));
  }, [isError, error]);

  return (
    <div className="page-wrap">
      <div className="invoices-header">
        <div>
          <h1 className="invoice-text mb-1">Invoices</h1>
          <p className="count-invoices-tect mb-0">
            There are {invoices.length} total Invoices
          </p>
        </div>

        <div className="invoices-header-actions">
          <Dropdown>
            <Dropdown.Toggle
              className="btn filter p-0"
              id="dropdown-basic"
              style={{ border: "none", background: "none" }}
            >
              <span className="mx-2">Filter by status</span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="menuclr px-0 py-2 mt-3">
              {[
                { label: "All", value: "" },
                { label: "Draft", value: "draft" },
                { label: "Pending", value: "pending" },
                { label: "Paid", value: "paid" },
                { label: "Cancelled", value: "cancelled" },
              ].map((option) => (
                <Dropdown.Item
                  key={option.value || "all"}
                  as="button"
                  className="menuitem"
                  onClick={() => setStatusFilter(option.value)}
                >
                  {option.label}
                  {statusFilter === option.value ? " ✓" : ""}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <button type="button" className="btn new-invoice" onClick={() => setShowForm(true)}>
            <span className="circle-plus me-2">
              <FontAwesomeIcon icon={faCirclePlus} />
            </span>
            New Invoice
          </button>
        </div>
      </div>

      {isLoading ? <p className="textcklr mt-4">Loading…</p> : <InvoiceList invoices={invoices} />}

      {showForm && (
        <InvoiceForm onClose={() => setShowForm(false)} onSaved={() => refetch()} />
      )}
    </div>
  );
}
