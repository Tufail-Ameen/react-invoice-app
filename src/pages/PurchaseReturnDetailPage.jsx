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
  useCancelPurchaseReturnMutation,
  useConfirmPurchaseReturnMutation,
  useGetPurchaseReturnQuery,
} from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

export default function PurchaseReturnDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useGetPurchaseReturnQuery(id);
  const [confirmPurchaseReturn] = useConfirmPurchaseReturnMutation();
  const [cancelPurchaseReturn] = useCancelPurchaseReturnMutation();

  const purchaseReturn = data?.purchaseReturn;
  const isDraft = String(purchaseReturn?.status || "").toUpperCase() === "DRAFT";

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Purchase return not found"));
  }, [isError, error]);

  const onConfirm = async () => {
    if (
      !window.confirm(
        "Confirm this purchase return? Stock will decrease and supplier payable will decrease."
      )
    ) {
      return;
    }
    try {
      await confirmPurchaseReturn(id).unwrap();
      toast.success("Purchase return confirmed");
    } catch (err) {
      toast.error(getErrorMessage(err, "Confirm failed"));
    }
  };

  const onCancel = async () => {
    if (!window.confirm("Cancel this draft purchase return?")) return;
    try {
      await cancelPurchaseReturn(id).unwrap();
      toast.success("Purchase return cancelled");
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

  if (!purchaseReturn) {
    return (
      <EmptyState
        title="Purchase return not found"
        message="This return does not exist or was deleted."
      />
    );
  }

  return (
    <div className="page-wrap invoice-detail">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate("/purchase-returns")}
      >
        <FontAwesomeIcon className="icon me-2" icon={faAngleLeft} size="2xs" />
        Go back
      </button>

      <div className="detail-toolbar">
        <div className="flex items-center gap-3">
          <span className="edit-discription mb-0">Status</span>
          <StatusBadge status={purchaseReturn.status} />
        </div>
        <div className="detail-actions">
          {isDraft && (
            <Can permission={PERMISSIONS.PURCHASE_RETURNS_CONFIRM}>
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
            <Can permission={PERMISSIONS.PURCHASE_RETURNS_CANCEL}>
              <button type="button" className="btn cancel py-2 px-3" onClick={onCancel}>
                Cancel
              </button>
            </Can>
          )}
        </div>
      </div>

      {isDraft && (
        <p className="textcklr mb-3 text-sm">
          Stock and payable update only when you confirm this return.
        </p>
      )}

      <div className="detail-card">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6">
            <p className="edit-id">#{purchaseReturn.returnNumber}</p>
            <p className="edit-discription">
              {purchaseReturn.reason || purchaseReturn.notes || "Purchase return"}
            </p>
          </div>
          <div className="col-span-12 md:col-span-6 md:text-end">
            <span className="edit-discription block">Purchase</span>
            <span className="date-bill-email block">
              <Link to={`/purchases/${purchaseReturn.purchaseId}`}>
                #{purchaseReturn.purchaseNumber || purchaseReturn.purchaseId}
              </Link>
            </span>
            <span className="edit-discription mt-3 block">Supplier</span>
            <span className="date-bill-email block">
              {purchaseReturn.supplierName || `#${purchaseReturn.supplierId}`}
            </span>
          </div>
        </div>

        <div className="table-setting my-4 overflow-x-auto">
          <table className="table m-0">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Cost</th>
                <th>Discount</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(purchaseReturn.items || []).map((item, index) => (
                <tr key={`${item.productId}-${index}`}>
                  <td>{item.productNameSnapshot || `Product #${item.productId}`}</td>
                  <td>{item.quantity}</td>
                  <td>{formatAmount("Rs", item.unitCost)}</td>
                  <td>{formatAmount("Rs", item.discount)}</td>
                  <td>{formatAmount("Rs", item.tax)}</td>
                  <td>{formatAmount("Rs", item.lineTotal)}</td>
                </tr>
              ))}
              <tr className="total">
                <th className="py-4 px-2" colSpan={5}>
                  Grand Total
                </th>
                <th className="total-price">
                  {formatAmount("Rs", purchaseReturn.grandTotal)}
                </th>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
