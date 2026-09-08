import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { useAuth } from "../auth/AuthContext";
import { Can } from "../auth/guards";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { PERMISSIONS } from "../lib/permissions";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import {
  useCreateClientPaymentMutation,
  useGetClientLedgerQuery,
  useGetClientQuery,
} from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

const paymentSchema = Yup.object({
  amount: Yup.number().positive("Amount must be > 0").required("Amount required"),
  paymentMethod: Yup.string().max(50),
  reference: Yup.string().max(100),
  notes: Yup.string().max(500),
});

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return String(value);
  }
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const canViewLedger = can(PERMISSIONS.CUSTOMER_LEDGER_VIEW);

  const {
    data: clientData,
    isLoading: clientLoading,
    isError: clientError,
    error: clientErr,
  } = useGetClientQuery(id);
  const {
    data: ledgerData,
    isLoading: ledgerLoading,
    isError: ledgerError,
    error: ledgerErr,
  } = useGetClientLedgerQuery(id, { skip: !canViewLedger });
  const [createPayment] = useCreateClientPaymentMutation();

  const client = clientData?.client;
  const entries = ledgerData?.entries || [];
  const summary = {
    totalSales: client?.totalSales ?? ledgerData?.summary?.totalSales ?? 0,
    totalPaid: client?.totalPaid ?? ledgerData?.summary?.totalPaid ?? 0,
    outstandingReceivable:
      client?.outstandingReceivable ??
      ledgerData?.summary?.outstandingReceivable ??
      0,
  };

  useEffect(() => {
    if (clientError) toast.error(getErrorMessage(clientErr, "Client not found"));
  }, [clientError, clientErr]);

  useEffect(() => {
    if (ledgerError) toast.error(getErrorMessage(ledgerErr, "Failed to load ledger"));
  }, [ledgerError, ledgerErr]);

  const onPayment = async (values, { resetForm }) => {
    try {
      await createPayment({
        id,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod || undefined,
        reference: values.reference || undefined,
        notes: values.notes || undefined,
      }).unwrap();
      toast.success("Payment recorded");
      resetForm();
    } catch (err) {
      toast.error(getErrorMessage(err, "Payment failed"));
    }
  };

  if (clientLoading || (canViewLedger && ledgerLoading)) {
    return (
      <div className="page-wrap">
        <p className="textcklr">Loading…</p>
      </div>
    );
  }

  if (!client) {
    return (
      <EmptyState title="Client not found" message="This client does not exist or was deleted." />
    );
  }

  return (
    <div className="page-wrap invoice-detail">
      <button type="button" className="back-link" onClick={() => navigate("/clients")}>
        <FontAwesomeIcon className="icon me-2" icon={faAngleLeft} size="2xs" />
        Go back
      </button>

      <div className="detail-toolbar">
        <div className="flex items-center gap-3">
          <h1 className="page-title mb-0">{client.name}</h1>
          <StatusBadge status={client.status} compact />
        </div>
      </div>

      <div className="detail-card mb-4">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-6">
            <span className="edit-discription block">Company</span>
            <span className="date-bill-email block">{client.companyName || "—"}</span>
            <span className="edit-discription mt-3 block">Phone</span>
            <span className="date-bill-email block">{client.phone || "—"}</span>
            <span className="edit-discription mt-3 block">Email</span>
            <span className="date-bill-email block">{client.email || "—"}</span>
          </div>
          <div className="col-span-12 md:col-span-6">
            <span className="edit-discription block">Address</span>
            <span className="date-bill-email block">
              {[client.address, client.city, client.country].filter(Boolean).join(", ") || "—"}
            </span>
            <span className="edit-discription mt-3 block">Tax Number</span>
            <span className="date-bill-email block">{client.taxNumber || "—"}</span>
            <span className="edit-discription mt-3 block">Notes</span>
            <span className="date-bill-email block">{client.notes || "—"}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-12 gap-3">
          <div className="col-span-4">
            <span className="edit-discription block">Total Sales</span>
            <span className="price block">{formatAmount("Rs", summary.totalSales)}</span>
          </div>
          <div className="col-span-4">
            <span className="edit-discription block">Total Paid</span>
            <span className="price block">{formatAmount("Rs", summary.totalPaid)}</span>
          </div>
          <div className="col-span-4">
            <span className="edit-discription block">Outstanding Receivable</span>
            <span className="price block">
              {formatAmount("Rs", summary.outstandingReceivable)}
            </span>
          </div>
        </div>
      </div>

      <Can permission={PERMISSIONS.CUSTOMER_PAYMENTS_CREATE}>
        <Formik
          initialValues={{ amount: "", paymentMethod: "", reference: "", notes: "" }}
          validationSchema={paymentSchema}
          onSubmit={onPayment}
        >
          <Form className="form-card mb-4">
            <h2 className="page-title">Record Payment</h2>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-3">
                <label className="form-label input-clr" htmlFor="amount">
                  Amount
                </label>
                <Field
                  name="amount"
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control input-settings"
                />
                <ErrorMessage name="amount" component="div" className="text-red-600" />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="form-label input-clr" htmlFor="paymentMethod">
                  Payment Method
                </label>
                <Field
                  name="paymentMethod"
                  id="paymentMethod"
                  className="form-control input-settings"
                  placeholder="Cash / Bank / …"
                />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="form-label input-clr" htmlFor="reference">
                  Reference
                </label>
                <Field name="reference" id="reference" className="form-control input-settings" />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="form-label input-clr" htmlFor="notes">
                  Notes
                </label>
                <Field name="notes" id="notes" className="form-control input-settings" />
              </div>
              <div className="col-span-12">
                <button type="submit" className="btn input-clr1 save-changes px-4 py-2">
                  Save Payment
                </button>
              </div>
            </div>
          </Form>
        </Formik>
      </Can>

      <h2 className="page-title mb-3">Ledger</h2>
      <Can
        permission={PERMISSIONS.CUSTOMER_LEDGER_VIEW}
        fallback={<p className="textcklr">You do not have permission to view the ledger.</p>}
      >
        {!entries.length ? (
          <EmptyState
            title="No ledger entries"
            message="Confirmed invoices and payments appear here."
          />
        ) : (
          <div className="table-setting overflow-x-auto">
            <table className="table m-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.createdAt)}</td>
                    <td>{entry.entryType}</td>
                    <td>
                      {entry.referenceType
                        ? `${entry.referenceType}${entry.referenceId != null ? ` #${entry.referenceId}` : ""}`
                        : entry.description || "—"}
                    </td>
                    <td>{formatAmount("Rs", entry.debit)}</td>
                    <td>{formatAmount("Rs", entry.credit)}</td>
                    <td>{formatAmount("Rs", entry.balanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Can>
    </div>
  );
}
