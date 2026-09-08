import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Can } from "../auth/guards";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { PERMISSIONS } from "../lib/permissions";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import {
  useCancelOrderMutation,
  useConvertOrderToInvoiceMutation,
  useGetOrderQuery,
  useSubmitOrderMutation,
} from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useGetOrderQuery(id);
  const [submitOrder] = useSubmitOrderMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [convertOrder] = useConvertOrderToInvoiceMutation();

  const order = data?.order;
  const statusUpper = String(order?.status || "").toUpperCase();
  const isDraft = statusUpper === "DRAFT";
  const isSubmitted = statusUpper === "SUBMITTED";
  const isConverted = statusUpper === "CONVERTED";
  const canCancel = isDraft || isSubmitted;

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Order not found"));
  }, [isError, error]);

  const onSubmit = async () => {
    if (!window.confirm("Submit this order? It can then be converted to an invoice.")) return;
    try {
      await submitOrder(id).unwrap();
      toast.success("Order submitted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Submit failed"));
    }
  };

  const onCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await cancelOrder(id).unwrap();
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(getErrorMessage(err, "Cancel failed"));
    }
  };

  const onConvert = async () => {
    if (
      !window.confirm(
        "Convert this order to a DRAFT invoice? Stock is not affected until the invoice is confirmed."
      )
    ) {
      return;
    }
    try {
      const result = await convertOrder(id).unwrap();
      toast.success("Converted to draft invoice");
      const invoiceId = result?.invoice?.id ?? result?.order?.invoiceId;
      if (invoiceId != null) {
        navigate(`/invoices/${invoiceId}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Convert failed"));
    }
  };

  if (isLoading) {
    return (
      <div className="page-wrap">
        <p className="textcklr">Loading…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState title="Order not found" message="This order does not exist or was deleted." />
    );
  }

  return (
    <div className="page-wrap invoice-detail">
      <button type="button" className="back-link" onClick={() => navigate("/orders")}>
        <FontAwesomeIcon className="icon me-2" icon={faAngleLeft} size="2xs" />
        Go back
      </button>

      <div className="detail-toolbar">
        <div className="flex flex-wrap items-center gap-3">
          <span className="btn pendingbtn px-3 py-1" style={{ fontSize: "12px" }}>
            ORDER
          </span>
          <span className="edit-discription mb-0">Status</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="detail-actions">
          {isDraft && (
            <Can permission={PERMISSIONS.ORDERS_UPDATE}>
              <Link to={`/orders/${id}/edit`} className="btn input-clr1 edit py-2 px-3">
                Edit
              </Link>
            </Can>
          )}
          {isDraft && (
            <Can permission={PERMISSIONS.ORDERS_SUBMIT}>
              <button
                type="button"
                className="btn input-clr1 save py-2 px-3"
                onClick={onSubmit}
              >
                Submit
              </button>
            </Can>
          )}
          {(isDraft || isSubmitted) && (
            <Can permission={PERMISSIONS.ORDERS_CONVERT}>
              <button
                type="button"
                className="btn input-clr1 save py-2 px-3"
                onClick={onConvert}
              >
                Convert to Invoice
              </button>
            </Can>
          )}
          {canCancel && (
            <Can permission={PERMISSIONS.ORDERS_CANCEL}>
              <button type="button" className="btn cancel py-2 px-3" onClick={onCancel}>
                Cancel
              </button>
            </Can>
          )}
          {isConverted && order.invoiceId != null && (
            <Link to={`/invoices/${order.invoiceId}`} className="btn edit py-2 px-3">
              View Invoice
            </Link>
          )}
        </div>
      </div>

      <p className="textcklr small mb-3">
        Orders do not reserve or deduct stock. Confirm the invoice after conversion to affect inventory.
      </p>

      {order.invoiceId != null && (
        <p className="textcklr small mb-3">
          Linked invoice:{" "}
          <Link to={`/invoices/${order.invoiceId}`}>#{order.invoiceId}</Link>
        </p>
      )}

      <div className="detail-card">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6">
            <p className="edit-id">#{order.orderNumber}</p>
            <p className="edit-discription">{order.notes || "Sales order"}</p>
          </div>
          <div className="col-span-12 md:col-span-6 md:text-end">
            <span className="edit-discription block">Customer</span>
            <span className="date-bill-email block">
              {order.customerName || order.clientName || `#${order.customerId || order.clientId}`}
            </span>
            <span className="edit-discription mt-3 block">Salesman</span>
            <span className="date-bill-email block">
              {order.salesmanName || (order.salesmanId != null ? `#${order.salesmanId}` : "—")}
            </span>
            {order.visitId != null && (
              <>
                <span className="edit-discription mt-3 block">Visit</span>
                <span className="date-bill-email block">#{order.visitId}</span>
              </>
            )}
            <span className="edit-discription mt-3 block">Created</span>
            <span className="date-bill-email block">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>

        <div className="table-setting my-4 overflow-x-auto">
          <table className="table m-0">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, index) => (
                <tr key={`${item.productId}-${index}`}>
                  <td>
                    {item.name || item.productNameSnapshot || `Product #${item.productId}`}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatAmount("Rs", item.unitPrice)}</td>
                  <td>{formatAmount("Rs", item.discount)}</td>
                  <td>{formatAmount("Rs", item.tax)}</td>
                  <td>{formatAmount("Rs", item.lineTotal)}</td>
                </tr>
              ))}
              <tr>
                <th className="py-2" colSpan={5}>
                  Subtotal
                </th>
                <th>{formatAmount("Rs", order.subtotal)}</th>
              </tr>
              <tr>
                <th className="py-2" colSpan={5}>
                  Discount
                </th>
                <th>{formatAmount("Rs", order.discount)}</th>
              </tr>
              <tr>
                <th className="py-2" colSpan={5}>
                  Tax
                </th>
                <th>{formatAmount("Rs", order.tax)}</th>
              </tr>
              <tr className="total">
                <th className="px-2 py-4" colSpan={5}>
                  Grand Total
                </th>
                <th className="total-price">{formatAmount("Rs", order.grandTotal)}</th>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
