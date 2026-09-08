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
  useDeleteExpenseMutation,
  useGetExpenseQuery,
} from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useGetExpenseQuery(id);
  const [voidExpense] = useDeleteExpenseMutation();

  const expense = data?.expense;
  const isActive = String(expense?.status || "").toUpperCase() === "ACTIVE";

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Expense not found"));
  }, [isError, error]);

  const onVoid = async () => {
    if (!window.confirm("Void this expense? This cannot be undone.")) return;
    try {
      await voidExpense(id).unwrap();
      toast.success("Expense voided");
    } catch (err) {
      toast.error(getErrorMessage(err, "Void failed"));
    }
  };

  if (isLoading) {
    return (
      <div className="page-wrap">
        <p className="textcklr">Loading…</p>
      </div>
    );
  }

  if (!expense) {
    return (
      <EmptyState title="Expense not found" message="This expense does not exist or was deleted." />
    );
  }

  return (
    <div className="page-wrap invoice-detail">
      <button type="button" className="back-link" onClick={() => navigate("/expenses")}>
        <FontAwesomeIcon className="icon me-2" icon={faAngleLeft} size="2xs" />
        Go back
      </button>

      <div className="detail-toolbar">
        <div className="flex items-center gap-3">
          <span className="edit-discription mb-0">Status</span>
          <StatusBadge status={expense.status} />
        </div>
        <div className="detail-actions">
          {isActive && (
            <Can permission={PERMISSIONS.EXPENSES_UPDATE}>
              <Link to={`/expenses/${id}/edit`} className="btn input-clr1 edit py-2 px-3">
                Edit
              </Link>
            </Can>
          )}
          {isActive && (
            <Can permission={PERMISSIONS.EXPENSES_DELETE}>
              <button type="button" className="btn cancel py-2 px-3" onClick={onVoid}>
                Void
              </button>
            </Can>
          )}
        </div>
      </div>

      <div className="detail-card">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6">
            <p className="edit-id">#{expense.expenseNumber}</p>
            <p className="edit-discription">{expense.description || "Expense"}</p>
          </div>
          <div className="col-span-12 md:col-span-6 md:text-end">
            <span className="edit-discription block">Category</span>
            <span className="date-bill-email block">{expense.categoryName || "—"}</span>
            <span className="edit-discription mt-3 block">Date</span>
            <span className="date-bill-email block">
              {expense.expenseDate
                ? new Date(expense.expenseDate).toLocaleDateString()
                : "—"}
            </span>
            <span className="edit-discription mt-3 block">Payment Method</span>
            <span className="date-bill-email block">{expense.paymentMethod || "—"}</span>
            <span className="edit-discription mt-3 block">Amount</span>
            <span className="date-bill-email block">{formatAmount("Rs", expense.amount)}</span>
            {expense.reference && (
              <>
                <span className="edit-discription mt-3 block">Reference</span>
                <span className="date-bill-email block">{expense.reference}</span>
              </>
            )}
            {expense.notes && (
              <>
                <span className="edit-discription mt-3 block">Notes</span>
                <span className="date-bill-email block">{expense.notes}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
