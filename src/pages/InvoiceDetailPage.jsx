import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import InvoiceForm from "../components/invoices/InvoiceForm";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
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
        <div className="flex items-center gap-3">
          <span className="edit-discription mb-0">Status</span>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="detail-actions">
          {invoice.status === "draft" && (
            <button
              type="button"
              className="btn input-clr1 edit py-2 px-3"
              onClick={() => setShowForm(true)}
            >
              Edit
            </button>
          )}
          {invoice.status !== "paid" && (
            <button type="button" className="btn input-clr1 delete py-2 px-3" onClick={onDelete}>
              Delete
            </button>
          )}
          {invoice.status === "draft" && (
            <button
              type="button"
              className="btn input-clr1 save py-2 px-3"
              onClick={() => setStatus("pending")}
            >
              Send (deduct stock)
            </button>
          )}
          {(invoice.status === "draft" || invoice.status === "pending") && (
            <button
              type="button"
              className="btn input-clr1 mark-paid py-2 px-3"
              onClick={() => setStatus("paid")}
            >
              Mark as Paid
            </button>
          )}
          {(invoice.status === "draft" || invoice.status === "pending") && (
            <button
              type="button"
              className="btn cancel py-2 px-3"
              onClick={() => setStatus("cancelled")}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="detail-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="edit-id">#{invoice.number}</p>
            <p className="edit-discription">{invoice.description}</p>
          </div>
          <div className="md:text-end">
            <p className="line-height m-0 p-0">{from.address},</p>
            <p className="line-height m-0 p-0">{from.city},</p>
            <p className="line-height m-0 p-0">{from.code},</p>
            <p className="line-height m-0 p-0">{from.country}</p>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-12">
          <div className="md:col-span-3">
            <span className="edit-discription block">Invoice Date</span>
            <span className="date-bill-email block">{invoice.issueDate}</span>
            <span className="edit-discription mt-4 block">Payment Due</span>
            <span className="date-bill-email block">{invoice.dueDate}</span>
          </div>
          <div className="md:col-span-4">
            <span className="edit-discription block">Bill To</span>
            <span className="date-bill-email block">{snap.name || invoice.clientName}</span>
            <p className="line-height mt-2 m-0 p-0">{snap.address},</p>
            <p className="line-height m-0 p-0">{snap.city},</p>
            <p className="line-height m-0 p-0">{snap.code},</p>
            <p className="line-height m-0 p-0">{snap.country}</p>
          </div>
          <div className="col-span-2 md:col-span-5">
            <span className="edit-discription block">Sent to</span>
            <span className="date-bill-email block">{snap.email || invoice.clientEmail}</span>
          </div>
        </div>

        <div className="table-setting my-4 overflow-x-auto">
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
