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
  useCancelSalesReturnMutation,
  useConfirmSalesReturnMutation,
  useGetSalesReturnQuery,
} from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

export default function SalesReturnDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useGetSalesReturnQuery(id);
  const [confirmSalesReturn] = useConfirmSalesReturnMutation();
  const [cancelSalesReturn] = useCancelSalesReturnMutation();

  const salesReturn = data?.salesReturn;
  const isDraft = String(salesReturn?.status || "").toUpperCase() === "DRAFT";

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Sales return not found"));
  }, [isError, error]);

  const onConfirm = async () => {
    if (
      !window.confirm(
        "Confirm this sales return? Stock will increase and customer receivable will decrease."
      )
    ) {
      return;
    }
    try {
      await confirmSalesReturn(id).unwrap();
      toast.success("Sales return confirmed");
    } catch (err) {
      toast.error(getErrorMessage(err, "Confirm failed"));
    }
  };

  const onCancel = async () => {
    if (!window.confirm("Cancel this draft sales return?")) return;
    try {
      await cancelSalesReturn(id).unwrap();
      toast.success("Sales return cancelled");
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

  if (!salesReturn) {
    return (
      <EmptyState
        title="Sales return not found"
        message="This return does not exist or was deleted."
      />
    );
  }

  return (
    <div className="page-wrap invoice-detail">
      <button type="button" className="back-link" onClick={() => navigate("/sales-returns")}>
        <FontAwesomeIcon className="icon me-2" icon={faAngleLeft} size="2xs" />
        Go back
      </button>

      <div className="detail-toolbar">
        <div className="flex items-center gap-3">
          <span className="edit-discription mb-0">Status</span>
          <StatusBadge status={salesReturn.status} />
        </div>
        <div className="detail-actions">
          {isDraft && (
            <Can permission={PERMISSIONS.SALES_RETURNS_CONFIRM}>
              <button
                type="button"
                className="btn input-clr1 save py-2 px-3"
                onClick={onConfirm}
              >
                Confirm
              </button>
            </Can>
          )}
          {isDraft && (
            <Can permission={PERMISSIONS.SALES_RETURNS_CANCEL}>
              <button type="button" className="btn cancel py-2 px-3" onClick={onCancel}>
                Cancel
              </button>
            </Can>
          )}
        </div>
      </div>

      {isDraft && (
        <p className="textcklr mb-3 text-sm">
          Stock and receivable update only when you confirm this return.
        </p>
      )}

      <div className="detail-card">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6">
            <p className="edit-id">#{salesReturn.returnNumber}</p>
            <p className="edit-discription">{salesReturn.reason || salesReturn.notes || "Sales return"}</p>
          </div>
          <div className="col-span-12 md:col-span-6 md:text-end">
            <span className="edit-discription block">Invoice</span>
            <span className="date-bill-email block">
              <Link to={`/invoices/${salesReturn.invoiceId}`}>
                #{salesReturn.invoiceNumber || salesReturn.invoiceId}
              </Link>
            </span>
            <span className="edit-discription mt-3 block">Customer</span>
            <span className="date-bill-email block">
              {salesReturn.customerName || `#${salesReturn.customerId}`}
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
              {(salesReturn.items || []).map((item, index) => (
                <tr key={`${item.productId}-${index}`}>
                  <td>{item.productNameSnapshot || `Product #${item.productId}`}</td>
                  <td>{item.quantity}</td>
                  <td>{formatAmount("Rs", item.unitPrice)}</td>
                  <td>{formatAmount("Rs", item.discount)}</td>
                  <td>{formatAmount("Rs", item.tax)}</td>
                  <td>{formatAmount("Rs", item.lineTotal)}</td>
                </tr>
              ))}
              <tr className="total">
                <th className="py-4 px-2" colSpan={5}>
                  Grand Total
                </th>
                <th className="total-price">{formatAmount("Rs", salesReturn.grandTotal)}</th>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
