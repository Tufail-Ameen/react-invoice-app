import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Can } from "../auth/guards";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { PERMISSIONS } from "../lib/permissions";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import { useGetEstimatesQuery } from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "DRAFT", value: "DRAFT" },
  { label: "SENT", value: "SENT" },
  { label: "ACCEPTED", value: "ACCEPTED" },
  { label: "REJECTED", value: "REJECTED" },
  { label: "EXPIRED", value: "EXPIRED" },
  { label: "CONVERTED", value: "CONVERTED" },
  { label: "CANCELLED", value: "CANCELLED" },
];

export default function EstimatesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");

  const params = { limit: 100 };
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading, isError, error } = useGetEstimatesQuery(params);
  const estimates = data?.estimates || [];

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Failed to load estimates"));
  }, [isError, error]);

  return (
    <div className="page-wrap">
      <div className="invoices-header">
        <div>
          <h1 className="invoice-text mb-1">Estimates</h1>
          <p className="count-invoices-tect mb-0">
            There are {estimates.length} total Estimates
          </p>
        </div>

        <div className="invoices-header-actions">
          <Dropdown>
            <Dropdown.Toggle
              className="btn filter p-0"
              id="estimate-status-filter"
              style={{ border: "none", background: "none" }}
            >
              <span className="mx-2">Filter by status</span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="menuclr px-0 py-2 mt-3">
              {STATUS_OPTIONS.map((option) => (
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

          <Can permission={PERMISSIONS.ESTIMATES_CREATE}>
            <Link to="/estimates/new" className="btn new-invoice">
              <span className="circle-plus me-2">
                <FontAwesomeIcon icon={faCirclePlus} />
              </span>
              New Estimate
            </Link>
          </Can>
        </div>
      </div>

      {isLoading ? (
        <p className="textcklr mt-4">Loading…</p>
      ) : !estimates.length ? (
        <EmptyState
          title="No estimates yet"
          message="Create a draft estimate to quote a customer."
        />
      ) : (
        <div className="d-flex flex-column gap-2 mt-3">
          {estimates.map((estimate) => (
            <div
              key={estimate.id}
              className="row align-items-center invoice-row datalist py-3 px-2 m-0 cursor"
              onClick={() => navigate(`/estimates/${estimate.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/estimates/${estimate.id}`);
              }}
            >
              <div className="col-12 col-md-2 table-text-size">
                <span className="hash-clr">#</span>
                {estimate.estimateNumber}
              </div>
              <div className="col-12 col-md-3 textcklr small">
                {estimate.clientName || estimate.customerName || `Client #${estimate.clientId}`}
              </div>
              <div className="col-6 col-md-2 textcklr small">
                {estimate.estimateDate
                  ? new Date(estimate.estimateDate).toLocaleDateString()
                  : "—"}
              </div>
              <div className="col-6 col-md-2 price">
                {formatAmount("Rs", estimate.grandTotal)}
              </div>
              <div className="col-12 col-md-3 mt-2 mt-md-0 d-flex justify-content-md-end">
                <StatusBadge status={estimate.status} compact />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
