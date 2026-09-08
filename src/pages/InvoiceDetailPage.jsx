import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../auth/AuthContext";
import { Can } from "../auth/guards";
import InvoiceForm from "../components/invoices/InvoiceForm";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { PERMISSIONS } from "../lib/permissions";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import {
  useConfirmInvoiceMutation,
  useDeleteInvoiceMutation,
  useGetInvoiceQuery,
  useUpdateInvoiceStatusMutation,
} from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError, error, refetch } = useGetInvoiceQuery(id);
  const [updateStatus] = useUpdateInvoiceStatusMutation();
  const [confirmInvoice] = useConfirmInvoiceMutation();
  const [deleteInvoice] = useDeleteInvoiceMutation();

  const invoice = data?.invoice;
  const status = normalizeStatus(invoice?.status);
  const paymentStatus = normalizeStatus(invoice?.paymentStatus);
  const isDraft = status === "draft";
  const isConfirmed = status === "confirmed" || status === "pending";
  const isPaid =
    paymentStatus === "paid" ||
    status === "paid" ||
    normalizeStatus(invoice?.uiStatus) === "paid";
  const isCancelled = status === "cancelled";
  const canConfirm =
    can(PERMISSIONS.INVOICES_CONFIRM) || can(PERMISSIONS.INVOICES_CHANGE_STATUS);

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Invoice not found"));
  }, [isError, error]);

  const setStatus = async (nextStatus) => {
    try {
      await updateStatus({ id, status: nextStatus }).unwrap();
      toast.success(`Status → ${nextStatus}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Status update failed"));
    }
  };

  const onConfirm = async () => {
    if (
      !window.confirm(
        "Confirm this invoice? Stock will be deducted and a customer receivable will be created."
      )
    ) {
      return;
    }
    try {
      if (can(PERMISSIONS.INVOICES_CONFIRM)) {
        await confirmInvoice(id).unwrap();
      } else {
        await updateStatus({ id, status: "pending" }).unwrap();
      }
      toast.success("Invoice confirmed — stock updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Confirm failed"));
    }
  };

  const onDelete = async () => {
    if (!window.confirm("Delete this invoice?")) return;
    try {
      await deleteInvoice(id).unwrap();
      toast.success("Deleted");
      navigate("/invoices");
    } catch (err) {
      toast.error(getErrorMessage(err, "Delete failed"));
    }
  };

  if (isLoading) {
    return (
      <div className="page-wrap">
        <p className="textcklr">Loading…</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <EmptyState title="Invoice not found" message="This invoice does not exist or was deleted." />
    );
  }

  const snap = invoice.clientSnapshot || {};
  const from = invoice.billFrom || {};

  return (
    <div className="page-wrap invoice-detail">
      <button type="button" className="back-link" onClick={() => navigate("/invoices")}>
        <FontAwesomeIcon className="icon me-2" icon={faAngleLeft} size="2xs" />
        Go back
      </button>

      <div className="detail-toolbar">
        <div className="flex flex-wrap items-center gap-3">
          <span className="edit-discription mb-0">Status</span>
          <StatusBadge status={isPaid && isConfirmed ? "paid" : invoice.status} />
        </div>
        <div className="detail-actions">
          {isDraft && (
            <Can permission={PERMISSIONS.INVOICES_UPDATE}>
              <button
                type="button"
                className="btn input-clr1 edit py-2 px-3"
                onClick={() => setShowForm(true)}
              >
                Edit
              </button>
            </Can>
          )}
          {!isPaid && !isCancelled && (
            <Can permission={PERMISSIONS.INVOICES_DELETE}>
              <button type="button" className="btn input-clr1 delete py-2 px-3" onClick={onDelete}>
                Delete
              </button>
            </Can>
          )}
          {isDraft && canConfirm && (
            <button
              type="button"
              className="btn input-clr1 save py-2 px-3"
              onClick={onConfirm}
            >
              Confirm
            </button>
          )}
          {isConfirmed && !isPaid && (
            <Can permission={PERMISSIONS.INVOICES_CHANGE_STATUS}>
              <button
                type="button"
                className="btn input-clr1 mark-paid py-2 px-3"
                onClick={() => setStatus("paid")}
              >
                Mark as Paid
              </button>
            </Can>
          )}
          {isDraft && (
            <Can permission={PERMISSIONS.INVOICES_CHANGE_STATUS}>
              <button
                type="button"
                className="btn cancel py-2 px-3"
                onClick={() => setStatus("cancelled")}
              >
                Cancel
              </button>
            </Can>
          )}
        </div>
      </div>

      {isDraft && (
        <p className="textcklr small mb-3">
          Stock deducts only when you confirm this invoice.
        </p>
      )}

      <div className="detail-card">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6">
            <p className="edit-id">#{invoice.number || invoice.invoiceNumber}</p>
            <p className="edit-discription">{invoice.description || invoice.notes}</p>
          </div>
          <div className="col-span-12 md:col-span-6 md:text-end">
            <p className="m-0 line-height p-0">{from.address},</p>
            <p className="m-0 line-height p-0">{from.city},</p>
            <p className="m-0 line-height p-0">{from.code},</p>
            <p className="m-0 line-height p-0">{from.country}</p>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-12 gap-4">
          <div className="col-span-6 md:col-span-3">
            <span className="edit-discription block">Invoice Date</span>
            <span className="date-bill-email block">{invoice.issueDate}</span>
            <span className="edit-discription mt-4 block">Payment Due</span>
            <span className="date-bill-email block">{invoice.dueDate}</span>
          </div>
          <div className="col-span-6 md:col-span-4">
            <span className="edit-discription block">Bill To</span>
            <span className="date-bill-email block">
              {snap.name || invoice.clientName || invoice.customerName}
            </span>
            <p className="m-0 mt-2 line-height p-0">{snap.address},</p>
            <p className="m-0 line-height p-0">{snap.city},</p>
            <p className="m-0 line-height p-0">{snap.code},</p>
            <p className="m-0 line-height p-0">{snap.country}</p>
          </div>
          <div className="col-span-12 md:col-span-5">
            <span className="edit-discription block">Sent to</span>
            <span className="date-bill-email block">
              {snap.email || invoice.clientEmail || "—"}
            </span>
          </div>
        </div>

        <div className="table-setting my-4 overflow-x-auto">
          <table className="table m-0">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Qty.</th>
                <th>Price</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item) => (
                <tr key={`${item.productId}-${item.name}`}>
                  <td>{item.name || item.productNameSnapshot}</td>
                  <td>{item.quantity}</td>
                  <td>{formatAmount(invoice.currency, item.unitPrice)}</td>
                  <td>{formatAmount(invoice.currency, item.tax)}</td>
                  <td>{formatAmount(invoice.currency, item.lineTotal)}</td>
                </tr>
              ))}
              <tr className="total">
                <th className="px-2 py-4" colSpan={4}>
                  Amount Due
                </th>
                <th className="total-price">
                  {formatAmount(invoice.currency, invoice.total ?? invoice.grandTotal)}
                </th>
              </tr>
              {invoice.paidAmount != null && (
                <tr>
                  <th className="py-2" colSpan={4}>
                    Paid
                  </th>
                  <th>{formatAmount(invoice.currency, invoice.paidAmount)}</th>
                </tr>
              )}
              {invoice.remainingAmount != null && (
                <tr>
                  <th className="py-2" colSpan={4}>
                    Remaining
                  </th>
                  <th>{formatAmount(invoice.currency, invoice.remainingAmount)}</th>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <InvoiceForm invoice={invoice} onClose={() => setShowForm(false)} onSaved={() => refetch()} />
      )}
    </div>
  );
}
