import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { toast } from "react-toastify";
import { invoicesApi } from "../api/endpoints";
import InvoiceForm from "../components/invoices/InvoiceForm";
import InvoiceList from "../components/invoices/InvoiceList";
import { ApiError } from "../lib/apiClient";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 100 };
      if (statusFilter) params.status = statusFilter;
      const data = await invoicesApi.list(params);
      setInvoices(data.invoices || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

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

      {loading ? <p className="textcklr mt-4">Loading…</p> : <InvoiceList invoices={invoices} />}

      {showForm && (
        <InvoiceForm
          onClose={() => setShowForm(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
