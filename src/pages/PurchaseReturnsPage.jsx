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
import { useGetPurchaseReturnsQuery } from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "DRAFT", value: "DRAFT" },
  { label: "CONFIRMED", value: "CONFIRMED" },
  { label: "CANCELLED", value: "CANCELLED" },
];

export default function PurchaseReturnsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");

  const params = { limit: 100 };
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading, isError, error } = useGetPurchaseReturnsQuery(params);
  const purchaseReturns = data?.purchaseReturns || [];

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Failed to load purchase returns"));
  }, [isError, error]);

  return (
    <div className="page-wrap">
      <div className="invoices-header">
        <div>
          <h1 className="invoice-text mb-1">Purchase Returns</h1>
          <p className="count-invoices-tect mb-0">
            There are {purchaseReturns.length} total Purchase Returns
          </p>
        </div>

        <div className="invoices-header-actions">
          <FilterMenu
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          <Can permission={PERMISSIONS.PURCHASE_RETURNS_CREATE}>
            <Link to="/purchase-returns/new" className="btn new-invoice">
              <span className="circle-plus me-2">
                <FontAwesomeIcon icon={faCirclePlus} />
              </span>
              New Return
            </Link>
          </Can>
        </div>
      </div>

      {isLoading ? (
        <p className="textcklr mt-4">Loading…</p>
      ) : !purchaseReturns.length ? (
        <EmptyState
          title="No purchase returns yet"
          message="Create a return against a confirmed purchase."
        />
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {purchaseReturns.map((row) => (
            <div
              key={row.id}
              className="invoice-row datalist cursor m-0 grid grid-cols-12 items-center px-2 py-3"
              onClick={() => navigate(`/purchase-returns/${row.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/purchase-returns/${row.id}`);
              }}
            >
              <div className="table-text-size col-span-12 md:col-span-2">
                <span className="hash-clr">#</span>
                {row.returnNumber}
              </div>
              <div className="textcklr col-span-12 text-sm md:col-span-3">
                Purchase #{row.purchaseNumber || row.purchaseId}
              </div>
              <div className="textcklr col-span-6 text-sm md:col-span-2">
                {row.supplierName || "—"}
              </div>
              <div className="price col-span-6 md:col-span-2">
                {formatAmount("Rs", row.grandTotal)}
              </div>
              <div className="col-span-12 mt-2 flex md:col-span-3 md:mt-0 md:justify-end">
                <StatusBadge status={row.status} compact />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
