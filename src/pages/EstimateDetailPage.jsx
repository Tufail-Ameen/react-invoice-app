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
  useConvertEstimateToInvoiceMutation,
  useGetEstimateQuery,
  useUpdateEstimateMutation,
} from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

export default function EstimateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useGetEstimateQuery(id);
  const [convertEstimate] = useConvertEstimateToInvoiceMutation();
  const [updateEstimate] = useUpdateEstimateMutation();

  const estimate = data?.estimate;
  const statusUpper = String(estimate?.status || "").toUpperCase();
  const isEditable = statusUpper !== "CONVERTED" && statusUpper !== "CANCELLED";
  const canConvert =
    isEditable && statusUpper !== "REJECTED" && statusUpper !== "EXPIRED";

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Estimate not found"));
  }, [isError, error]);

  const onConvert = async () => {
    if (
      !window.confirm(
        "Convert this estimate to a DRAFT invoice? Stock is not affected until the invoice is confirmed."
      )
    ) {
      return;
    }
    try {
      const result = await convertEstimate(id).unwrap();
      toast.success("Converted to draft invoice");
      const invoiceId = result?.invoice?.id;
      if (invoiceId != null) {
        navigate(`/invoices/${invoiceId}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Convert failed"));
    }
  };

  const onCancel = async () => {
    if (!window.confirm("Cancel this estimate?")) return;
    try {
      await updateEstimate({ id, status: "CANCELLED" }).unwrap();
      toast.success("Estimate cancelled");
    } catch (err) {
      toast.error(getErrorMessage(err, "Cancel failed"));
    }
  };

  if (isLoading) {
    return (
      <div className="page-wrap">
        <p className="textcklr">Loading…</p>
      </div>
    );
  }

  if (!estimate) {
    return (
      <EmptyState title="Estimate not found" message="This estimate does not exist or was deleted." />
    );
  }

  return (
    <div className="page-wrap invoice-detail">
      <button type="button" className="back-link" onClick={() => navigate("/estimates")}>
        <FontAwesomeIcon className="icon me-2" icon={faAngleLeft} size="2xs" />
        Go back
      </button>

      <div className="detail-toolbar">
        <div className="flex flex-wrap items-center gap-3">
          <span className="btn pendingbtn px-3 py-1" style={{ fontSize: "12px" }}>
            ESTIMATE
          </span>
          <span className="edit-discription mb-0">Status</span>
          <StatusBadge status={estimate.status} />
        </div>
        <div className="detail-actions">
          {canConvert && (
            <Can permission={PERMISSIONS.ESTIMATES_CONVERT}>
              <button
                type="button"
                className="btn input-clr1 save py-2 px-3"
                onClick={onConvert}
              >
                Convert to Invoice
              </button>
            </Can>
          )}
          {isEditable && (
            <Can permission={PERMISSIONS.ESTIMATES_UPDATE}>
              <Link
                to={`/estimates/${id}/edit`}
                className="btn input-clr1 edit py-2 px-3"
              >
                Edit
              </Link>
            </Can>
          )}
          {isEditable && (
            <Can permission={PERMISSIONS.ESTIMATES_UPDATE}>
              <button type="button" className="btn cancel py-2 px-3" onClick={onCancel}>
                Cancel
              </button>
            </Can>
          )}
        </div>
      </div>

      <p className="textcklr small mb-3">
        Estimates do not reserve or deduct stock. Confirm the invoice after conversion to affect inventory.
      </p>

      {estimate.invoiceId != null && (
        <p className="textcklr small mb-3">
          Linked invoice:{" "}
          <Link to={`/invoices/${estimate.invoiceId}`}>#{estimate.invoiceId}</Link>
        </p>
      )}

      <div className="detail-card">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6">
            <p className="edit-id">#{estimate.estimateNumber}</p>
            <p className="edit-discription">{estimate.notes || "Customer estimate"}</p>
          </div>
          <div className="col-span-12 md:col-span-6 md:text-end">
            <span className="edit-discription block">Customer</span>
            <span className="date-bill-email block">
              {estimate.clientName || estimate.customerName || `#${estimate.clientId}`}
            </span>
            <span className="edit-discription mt-3 block">Estimate Date</span>
            <span className="date-bill-email block">
              {estimate.estimateDate
                ? new Date(estimate.estimateDate).toLocaleDateString()
                : "—"}
            </span>
            <span className="edit-discription mt-3 block">Valid Until</span>
            <span className="date-bill-email block">
              {estimate.validUntil
                ? new Date(estimate.validUntil).toLocaleDateString()
                : "—"}
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
              {(estimate.items || []).map((item, index) => (
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
                <th>{formatAmount("Rs", estimate.subtotal)}</th>
              </tr>
              <tr>
                <th className="py-2" colSpan={5}>
                  Discount
                </th>
                <th>{formatAmount("Rs", estimate.discount)}</th>
              </tr>
              <tr>
                <th className="py-2" colSpan={5}>
                  Tax
                </th>
                <th>{formatAmount("Rs", estimate.tax)}</th>
              </tr>
              <tr className="total">
                <th className="px-2 py-4" colSpan={5}>
                  Grand Total
                </th>
                <th className="total-price">{formatAmount("Rs", estimate.grandTotal)}</th>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
