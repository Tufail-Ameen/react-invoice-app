import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import {
  useGetSalesmanOrdersQuery,
  useGetSalesmanQuery,
  useGetSalesmanSummaryQuery,
  useGetSalesmanVisitsQuery,
} from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

export default function SalesmanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useGetSalesmanQuery(id);
  const { data: summaryData } = useGetSalesmanSummaryQuery({ id });
  const { data: visitsData } = useGetSalesmanVisitsQuery(id);
  const { data: ordersData } = useGetSalesmanOrdersQuery(id);

  const salesman = data?.salesman;
  const summary = summaryData?.summary || {};
  const visits = visitsData?.visits || [];
  const orders = ordersData?.orders || [];

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Salesman not found"));
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="page-wrap">
        <p className="textcklr">Loading…</p>
      </div>
    );
  }

  if (!salesman) {
    return (
      <EmptyState title="Salesman not found" message="This profile does not exist or was deleted." />
    );
  }

  return (
    <div className="page-wrap invoice-detail">
      <button type="button" className="back-link" onClick={() => navigate("/salesmen")}>
        <FontAwesomeIcon className="icon me-2" icon={faAngleLeft} size="2xs" />
        Go back
      </button>

      <div className="detail-toolbar">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title mb-0">{salesman.displayName}</h1>
          <StatusBadge status={salesman.status} compact />
        </div>
      </div>

      <div className="detail-card mb-4">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-6">
            <span className="edit-discription block">Employee Code</span>
            <span className="date-bill-email block">{salesman.employeeCode || "—"}</span>
            <span className="edit-discription mt-3 block">Phone</span>
            <span className="date-bill-email block">{salesman.phone || "—"}</span>
            <span className="edit-discription mt-3 block">Email</span>
            <span className="date-bill-email block">{salesman.email || "—"}</span>
          </div>
          <div className="col-span-12 md:col-span-6">
            <span className="edit-discription block">Notes</span>
            <span className="date-bill-email block">{salesman.notes || "—"}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-12 gap-3">
          <div className="col-span-6 md:col-span-2">
            <span className="edit-discription block">Visits</span>
            <span className="price block">{summary.totalVisits ?? 0}</span>
          </div>
          <div className="col-span-6 md:col-span-2">
            <span className="edit-discription block">Orders</span>
            <span className="price block">{summary.totalOrders ?? 0}</span>
          </div>
          <div className="col-span-6 md:col-span-2">
            <span className="edit-discription block">Submitted</span>
            <span className="price block">{summary.submittedOrders ?? 0}</span>
          </div>
          <div className="col-span-6 md:col-span-2">
            <span className="edit-discription block">Converted</span>
            <span className="price block">{summary.convertedOrders ?? 0}</span>
          </div>
          <div className="col-span-6 md:col-span-2">
            <span className="edit-discription block">Confirmed Invoices</span>
            <span className="price block">{summary.confirmedInvoices ?? 0}</span>
          </div>
          <div className="col-span-6 md:col-span-2">
            <span className="edit-discription block">Confirmed Sales</span>
            <span className="price block">
              {formatAmount("Rs", summary.confirmedSalesAmount ?? 0)}
            </span>
          </div>
        </div>
      </div>

      <h2 className="page-title mb-3">Recent Visits</h2>
      {!visits.length ? (
        <EmptyState title="No visits" message="Visits for this salesman will appear here." />
      ) : (
        <div className="mb-4 flex flex-col gap-2">
          {visits.slice(0, 20).map((visit) => (
            <div
              key={visit.id}
              className="invoice-row datalist m-0 grid grid-cols-12 items-center px-2 py-3"
            >
              <div className="table-text-size col-span-12 md:col-span-2">#{visit.id}</div>
              <div className="textcklr col-span-12 text-sm md:col-span-4">
                {visit.customerName || `#${visit.customerId}`}
              </div>
              <div className="textcklr col-span-6 text-sm md:col-span-3">
                {visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : "—"}
              </div>
              <div className="col-span-6 flex md:col-span-3 md:justify-end">
                <StatusBadge status={visit.status} compact />
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="page-title mb-3">Recent Orders</h2>
      {!orders.length ? (
        <EmptyState title="No orders" message="Orders for this salesman will appear here." />
      ) : (
        <div className="flex flex-col gap-2">
          {orders.slice(0, 20).map((order) => (
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
                <Link to={`/orders/${order.id}`} onClick={(e) => e.stopPropagation()}>
                  #{order.orderNumber}
                </Link>
              </div>
              <div className="textcklr col-span-12 text-sm md:col-span-4">
                {order.customerName || `#${order.customerId}`}
              </div>
              <div className="price col-span-6 md:col-span-3">
                {formatAmount("Rs", order.grandTotal)}
              </div>
              <div className="col-span-6 flex md:col-span-3 md:justify-end">
                <StatusBadge status={order.status} compact />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
