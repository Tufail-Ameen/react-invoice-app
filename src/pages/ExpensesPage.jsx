import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Can } from "../auth/guards";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { PERMISSIONS } from "../lib/permissions";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import {
  useCreateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
  useGetExpenseCategoriesQuery,
  useGetExpensesQuery,
} from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

export default function ExpensesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("expenses");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const expenseParams = { limit: 100 };
  if (search.trim()) expenseParams.q = search.trim();
  if (categoryId) expenseParams.categoryId = categoryId;
  if (from) expenseParams.from = from;
  if (to) expenseParams.to = to;

  const {
    data: expensesData,
    isLoading,
    isError,
    error,
  } = useGetExpensesQuery(expenseParams);
  const { data: categoriesData } = useGetExpenseCategoriesQuery({
    includeArchived: tab === "categories" ? "true" : undefined,
  });
  const [createCategory] = useCreateExpenseCategoryMutation();
  const [deleteCategory] = useDeleteExpenseCategoryMutation();

  const expenses = expensesData?.expenses || [];
  const summaryTotal = expensesData?.summary?.totalAmount || 0;
  const categories = categoriesData?.categories || [];
  const activeCategories = categories.filter(
    (c) => String(c.status).toUpperCase() === "ACTIVE"
  );

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Failed to load expenses"));
  }, [isError, error]);

  const onCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await createCategory({ name: newCategoryName.trim() }).unwrap();
      toast.success("Category created");
      setNewCategoryName("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Create category failed"));
    }
  };

  const onArchiveCategory = async (id) => {
    if (!window.confirm("Archive this category?")) return;
    try {
      await deleteCategory(id).unwrap();
      toast.success("Category archived");
    } catch (err) {
      toast.error(getErrorMessage(err, "Archive failed"));
    }
  };

  return (
    <div className="page-wrap">
      <div className="invoices-header">
        <div>
          <h1 className="invoice-text mb-1">Expenses</h1>
          <p className="count-invoices-tect mb-0">
            {tab === "expenses"
              ? `Total (active filters): ${formatAmount("Rs", summaryTotal)}`
              : "Manage expense categories"}
          </p>
        </div>

        <div className="invoices-header-actions">
          <div className="flex gap-2">
            <button
              type="button"
              className={`btn py-2 px-3 ${tab === "expenses" ? "save" : "edit"}`}
              onClick={() => setTab("expenses")}
            >
              Expenses
            </button>
            <Can permission={PERMISSIONS.EXPENSE_CATEGORIES_VIEW}>
              <button
                type="button"
                className={`btn py-2 px-3 ${tab === "categories" ? "save" : "edit"}`}
                onClick={() => setTab("categories")}
              >
                Categories
              </button>
            </Can>
          </div>

          {tab === "expenses" && (
            <Can permission={PERMISSIONS.EXPENSES_CREATE}>
              <Link to="/expenses/new" className="btn new-invoice">
                <span className="circle-plus me-2">
                  <FontAwesomeIcon icon={faCirclePlus} />
                </span>
                New Expense
              </Link>
            </Can>
          )}
        </div>
      </div>

      {tab === "expenses" ? (
        <>
          <div className="mt-3 grid grid-cols-12 gap-2">
            <div className="col-span-12 md:col-span-4">
              <input
                className="form-control input-clr1"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <select
                className="form-select input-clr1"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">All categories</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-6 md:col-span-2">
              <input
                type="date"
                className="form-control input-clr1"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="col-span-6 md:col-span-2">
              <input
                type="date"
                className="form-control input-clr1"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <p className="textcklr mt-4">Loading…</p>
          ) : !expenses.length ? (
            <EmptyState
              title="No expenses yet"
              message="Record an expense or adjust filters."
            />
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {expenses.map((row) => (
                <div
                  key={row.id}
                  className="invoice-row datalist cursor m-0 grid grid-cols-12 items-center px-2 py-3"
                  onClick={() => navigate(`/expenses/${row.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") navigate(`/expenses/${row.id}`);
                  }}
                >
                  <div className="table-text-size col-span-12 md:col-span-2">
                    <span className="hash-clr">#</span>
                    {row.expenseNumber}
                  </div>
                  <div className="textcklr col-span-12 text-sm md:col-span-3">
                    {row.categoryName || "—"}
                  </div>
                  <div className="textcklr col-span-6 text-sm md:col-span-2">
                    {row.expenseDate
                      ? new Date(row.expenseDate).toLocaleDateString()
                      : "—"}
                  </div>
                  <div className="price col-span-6 md:col-span-2">
                    {formatAmount("Rs", row.amount)}
                  </div>
                  <div className="col-span-12 mt-2 flex md:col-span-3 md:mt-0 md:justify-end">
                    <StatusBadge status={row.status} compact />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="mt-4">
          <Can permission={PERMISSIONS.EXPENSE_CATEGORIES_CREATE}>
            <form className="mb-4 flex flex-wrap gap-2" onSubmit={onCreateCategory}>
              <input
                className="form-control input-clr1"
                style={{ maxWidth: 280 }}
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button type="submit" className="btn input-clr1 save py-2 px-3">
                Add Category
              </button>
            </form>
          </Can>

          {!categories.length ? (
            <EmptyState title="No categories" message="Create a category to classify expenses." />
          ) : (
            <div className="flex flex-col gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="invoice-row datalist m-0 grid grid-cols-12 items-center px-2 py-3"
                >
                  <div className="table-text-size col-span-12 md:col-span-5">{cat.name}</div>
                  <div className="textcklr col-span-6 text-sm md:col-span-4">
                    {cat.description || "—"}
                  </div>
                  <div className="col-span-6 flex items-center justify-end gap-2 md:col-span-3">
                    <StatusBadge status={cat.status} compact />
                    {String(cat.status).toUpperCase() === "ACTIVE" && (
                      <Can permission={PERMISSIONS.EXPENSE_CATEGORIES_DELETE}>
                        <button
                          type="button"
                          className="btn cancel py-1 px-2"
                          style={{ fontSize: 12 }}
                          onClick={() => onArchiveCategory(cat.id)}
                        >
                          Archive
                        </button>
                      </Can>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
