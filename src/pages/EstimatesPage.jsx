import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Can } from "../auth/guards";
import EmptyState from "../components/ui/EmptyState";
import FilterMenu from "../components/ui/FilterMenu";
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
          <FilterMenu
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />

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
        <div className="mt-3 flex flex-col gap-2">
          {estimates.map((estimate) => (
            <div
              key={estimate.id}
              className="invoice-row datalist cursor m-0 grid grid-cols-12 items-center px-2 py-3"
              onClick={() => navigate(`/estimates/${estimate.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/estimates/${estimate.id}`);
              }}
            >
              <div className="table-text-size col-span-12 md:col-span-2">
                <span className="hash-clr">#</span>
                {estimate.estimateNumber}
              </div>
              <div className="textcklr col-span-12 text-sm md:col-span-3">
                {estimate.clientName || estimate.customerName || `Client #${estimate.clientId}`}
              </div>
              <div className="textcklr col-span-6 text-sm md:col-span-2">
                {estimate.estimateDate
                  ? new Date(estimate.estimateDate).toLocaleDateString()
                  : "—"}
              </div>
              <div className="price col-span-6 md:col-span-2">
                {formatAmount("Rs", estimate.grandTotal)}
              </div>
              <div className="col-span-12 mt-2 flex md:col-span-3 md:mt-0 md:justify-end">
                <StatusBadge status={estimate.status} compact />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
