import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import * as Yup from "yup";
import EmptyState from "../components/ui/EmptyState";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import {
  useCreateExpenseMutation,
  useGetExpenseCategoriesQuery,
  useGetExpenseQuery,
  useUpdateExpenseMutation,
} from "../services/invoiceApi";

const schema = Yup.object({
  categoryId: Yup.string().required("Category required"),
  amount: Yup.number().positive("Amount must be > 0").required("Amount required"),
  expenseDate: Yup.string(),
  paymentMethod: Yup.string(),
  description: Yup.string().max(500),
  reference: Yup.string().max(100),
  notes: Yup.string().max(500),
});

export default function ExpenseFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: categoriesData } = useGetExpenseCategoriesQuery({});
  const {
    data,
    isLoading,
    isError,
    error,
  } = useGetExpenseQuery(id, { skip: !isEdit });
  const [createExpense] = useCreateExpenseMutation();
  const [updateExpense] = useUpdateExpenseMutation();

  const expense = data?.expense;
  const categories = (categoriesData?.categories || []).filter(
    (c) => String(c.status).toUpperCase() === "ACTIVE"
  );

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Expense not found"));
  }, [isError, error]);

  if (isEdit && isLoading) {
    return (
      <div className="page-wrap">
        <p className="textcklr">Loading…</p>
      </div>
    );
  }

  if (isEdit && !expense) {
    return (
      <EmptyState title="Expense not found" message="This expense does not exist or was deleted." />
    );
  }

  if (isEdit && String(expense.status).toUpperCase() === "VOID") {
    return (
      <div className="page-wrap">
        <EmptyState title="Voided expenses cannot be edited" message="Open the detail page instead." />
        <Link to={`/expenses/${id}`} className="btn edit py-2 px-3">
          View expense
        </Link>
      </div>
    );
  }

  const initialValues = {
    categoryId: expense?.categoryId != null ? String(expense.categoryId) : "",
    amount: expense?.amount ?? "",
    expenseDate: expense?.expenseDate
      ? new Date(expense.expenseDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    paymentMethod: expense?.paymentMethod || "cash",
    description: expense?.description || "",
    reference: expense?.reference || "",
    notes: expense?.notes || "",
  };

  const onSubmit = async (values) => {
    const payload = {
      categoryId: Number(values.categoryId),
      amount: Number(values.amount),
      expenseDate: values.expenseDate || undefined,
      paymentMethod: values.paymentMethod || "cash",
      description: values.description || undefined,
      reference: values.reference || undefined,
      notes: values.notes || undefined,
    };

    try {
      if (isEdit) {
        await updateExpense({ id, ...payload }).unwrap();
        toast.success("Expense updated");
        navigate(`/expenses/${id}`);
      } else {
        const result = await createExpense(payload).unwrap();
        toast.success("Expense created");
        navigate(`/expenses/${result.expense?.id ?? result.id}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Save failed"));
    }
  };

  return (
    <div className="page-wrap">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate(isEdit ? `/expenses/${id}` : "/expenses")}
      >
        <FontAwesomeIcon className="icon me-2" icon={faAngleLeft} size="2xs" />
        Go back
      </button>

      <h1 className="invoice-text mb-3">{isEdit ? "Edit Expense" : "New Expense"}</h1>

      <Formik initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit} enableReinitialize>
        {({ isSubmitting }) => (
          <Form className="detail-card">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-6">
                <label className="edit-discription mb-1 block">Category</label>
                <Field as="select" name="categoryId" className="form-select input-clr1">
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="categoryId" component="div" className="text-danger small" />
              </div>
              <div className="col-span-12 md:col-span-6">
                <label className="edit-discription mb-1 block">Amount</label>
                <Field type="number" name="amount" className="form-control input-clr1" min="0.01" step="0.01" />
                <ErrorMessage name="amount" component="div" className="text-danger small" />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="edit-discription mb-1 block">Date</label>
                <Field type="date" name="expenseDate" className="form-control input-clr1" />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="edit-discription mb-1 block">Payment Method</label>
                <Field as="select" name="paymentMethod" className="form-select input-clr1">
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online</option>
                  <option value="other">Other</option>
                </Field>
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="edit-discription mb-1 block">Reference</label>
                <Field name="reference" className="form-control input-clr1" />
              </div>
              <div className="col-span-12">
                <label className="edit-discription mb-1 block">Description</label>
                <Field name="description" className="form-control input-clr1" />
              </div>
              <div className="col-span-12">
                <label className="edit-discription mb-1 block">Notes</label>
                <Field as="textarea" name="notes" className="form-control input-clr1" rows={3} />
              </div>
            </div>

            <div className="mt-4">
              <button type="submit" className="btn input-clr1 save py-2 px-3" disabled={isSubmitting}>
                {isEdit ? "Update" : "Create"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
