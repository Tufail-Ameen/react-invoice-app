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
import { useGetOrdersQuery } from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "DRAFT", value: "DRAFT" },
  { label: "SUBMITTED", value: "SUBMITTED" },
  { label: "CONVERTED", value: "CONVERTED" },
  { label: "CANCELLED", value: "CANCELLED" },
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");

  const params = { limit: 100 };
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading, isError, error } = useGetOrdersQuery(params);
  const orders = data?.orders || [];

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Failed to load orders"));
  }, [isError, error]);

  return (
    <div className="page-wrap">
      <div className="invoices-header">
        <div>
          <h1 className="invoice-text mb-1">Orders</h1>
          <p className="count-invoices-tect mb-0">
            There are {orders.length} total Orders
          </p>
        </div>

        <div className="invoices-header-actions">
          <FilterMenu
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          <Can permission={PERMISSIONS.ORDERS_CREATE}>
            <Link to="/orders/new" className="btn new-invoice">
              <span className="circle-plus me-2">
                <FontAwesomeIcon icon={faCirclePlus} />
              </span>
              New Order
            </Link>
          </Can>
        </div>
      </div>

      {isLoading ? (
        <p className="textcklr mt-4">Loading…</p>
      ) : !orders.length ? (
        <EmptyState
          title="No orders yet"
          message="Create a draft order. Stock is not affected until converted and the invoice is confirmed."
        />
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {orders.map((order) => (
            <div
              key={order.id}
              className="invoice-row datalist cursor m-0 grid grid-cols-12 items-center px-2 py-3"
              onClick={() => navigate(`/orders/${order.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/orders/${order.id}`);
              }}
            >
              <div className="table-text-size col-span-12 md:col-span-2">
                <span className="hash-clr">#</span>
                {order.orderNumber}
              </div>
              <div className="textcklr col-span-12 text-sm md:col-span-3">
                {order.customerName || order.clientName || `Client #${order.customerId || order.clientId}`}
              </div>
              <div className="textcklr col-span-6 text-sm md:col-span-2">
                {order.salesmanName || (order.salesmanId != null ? `#${order.salesmanId}` : "—")}
              </div>
              <div className="price col-span-6 md:col-span-2">
                {formatAmount("Rs", order.grandTotal)}
              </div>
              <div className="col-span-12 mt-2 flex md:col-span-3 md:mt-0 md:justify-end">
                <StatusBadge status={order.status} compact />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
