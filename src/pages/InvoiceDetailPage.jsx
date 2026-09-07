import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Can } from "../auth/guards";
import InvoiceForm from "../components/invoices/InvoiceForm";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { PERMISSIONS } from "../lib/permissions";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import {
  useDeleteInvoiceMutation,
  useGetInvoiceQuery,
  useUpdateInvoiceStatusMutation,
} from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError, error, refetch } = useGetInvoiceQuery(id);
  const [updateStatus] = useUpdateInvoiceStatusMutation();
  const [deleteInvoice] = useDeleteInvoiceMutation();

  const invoice = data?.invoice;

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Invoice not found"));
  }, [isError, error]);

  const setStatus = async (status) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Status → ${status}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Status update failed"));
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
        <div className="d-flex align-items-center gap-3">
          <span className="edit-discription mb-0">Status</span>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="detail-actions">
          {invoice.status === "draft" && (
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
          {invoice.status !== "paid" && (
            <Can permission={PERMISSIONS.INVOICES_DELETE}>
              <button type="button" className="btn input-clr1 delete py-2 px-3" onClick={onDelete}>
                Delete
              </button>
            </Can>
          )}
          {invoice.status === "draft" && (
            <Can permission={PERMISSIONS.INVOICES_CHANGE_STATUS}>
              <button
                type="button"
                className="btn input-clr1 save py-2 px-3"
                onClick={() => setStatus("pending")}
              >
                Send (deduct stock)
              </button>
            </Can>
          )}
          {(invoice.status === "draft" || invoice.status === "pending") && (
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
          {(invoice.status === "draft" || invoice.status === "pending") && (
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

      <div className="detail-card">
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <p className="edit-id">#{invoice.number}</p>
            <p className="edit-discription">{invoice.description}</p>
          </div>
          <div className="col-12 col-md-6 text-md-end">
            <p className="p-0 m-0 line-height">{from.address},</p>
            <p className="p-0 m-0 line-height">{from.city},</p>
            <p className="p-0 m-0 line-height">{from.code},</p>
            <p className="p-0 m-0 line-height">{from.country}</p>
          </div>
        </div>

        <div className="row g-4 mt-2">
          <div className="col-6 col-md-3">
            <span className="d-block edit-discription">Invoice Date</span>
            <span className="d-block date-bill-email">{invoice.issueDate}</span>
            <span className="d-block edit-discription mt-4">Payment Due</span>
            <span className="d-block date-bill-email">{invoice.dueDate}</span>
          </div>
          <div className="col-6 col-md-4">
            <span className="d-block edit-discription">Bill To</span>
            <span className="d-block date-bill-email">{snap.name || invoice.clientName}</span>
            <p className="p-0 m-0 mt-2 line-height">{snap.address},</p>
            <p className="p-0 m-0 line-height">{snap.city},</p>
            <p className="p-0 m-0 line-height">{snap.code},</p>
            <p className="p-0 m-0 line-height">{snap.country}</p>
          </div>
          <div className="col-12 col-md-5">
            <span className="d-block edit-discription">Sent to</span>
            <span className="d-block date-bill-email">{snap.email || invoice.clientEmail}</span>
          </div>
        </div>

        <div className="table-responsive table-setting my-4">
          <table className="table m-0">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Qty.</th>
                <th>Price</th>
                <th>Tax(%)</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item) => (
                <tr key={`${item.productId}-${item.name}`}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatAmount(invoice.currency, item.unitPrice)}</td>
                  <td>{item.tax}%</td>
                  <td>{formatAmount(invoice.currency, item.lineTotal)}</td>
                </tr>
              ))}
              <tr className="total">
                <th className="py-4 px-2" colSpan={4}>
                  Amount Due
                </th>
                <th className="total-price">{formatAmount(invoice.currency, invoice.total)}</th>
              </tr>
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
