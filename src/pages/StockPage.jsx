import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ErrorMessage, Field, Form, Formik, useFormikContext } from "formik";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";
import EmptyState from "../components/ui/EmptyState";
import { useProducts } from "../hooks/useProducts";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import {
  useAdjustInventoryMutation,
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetMovementsQuery,
  useUpdateProductMutation,
} from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

const productSchema = Yup.object({
  category: Yup.string().trim().required("Category required"),
  name: Yup.string().required("Name required"),
  tpRate: Yup.number().min(0).required("TP rate required"),
  discountPercent: Yup.number().min(0).max(100).required("Discount % required"),
  printRate: Yup.number().min(0).required("Price required"),
  stock: Yup.number().integer().min(0).required("Stock required"),
  unit: Yup.string().default("pcs"),
});

const productEditSchema = productSchema.omit(["stock"]);

function calcNetRate(tpRate, discountPercent) {
  const tp = Number(tpRate);
  const pct = Number(discountPercent);
  if (!Number.isFinite(tp) || tp < 0) return "";
  if (!Number.isFinite(pct) || pct < 0) return tp;
  return Math.round(tp * (1 - pct / 100) * 100) / 100;
}

const emptyProductForm = {
  category: "",
  name: "",
  tpRate: "",
  discountPercent: 0,
  netRate: "",
  printRate: "",
  stock: 0,
  unit: "pcs",
  status: "active",
};

function productToFormValues(product) {
  const tpRate = product.tpRate ?? product.price ?? "";
  const discountPercent = product.discountPercent ?? 0;
  const netRate = calcNetRate(tpRate, discountPercent);
  return {
    category: product.category ?? "",
    name: product.name ?? "",
    tpRate,
    discountPercent,
    netRate,
    printRate: product.printRate ?? product.price ?? "",
    stock: product.stock ?? 0,
    unit: product.unit || "pcs",
    status: product.status || "active",
  };
}

function applyPricing(values, setFieldValue, updates) {
  const next = { ...values, ...updates };
  const netRate = calcNetRate(next.tpRate, next.discountPercent);
  Object.entries(updates).forEach(([key, value]) => setFieldValue(key, value));
  setFieldValue("netRate", netRate);
}

function buildProductPayload(values) {
  return {
    category: values.category.trim(),
    name: values.name,
    tpRate: Number(values.tpRate),
    discountPercent: Number(values.discountPercent) || 0,
    printRate: Number(values.printRate),
    netRate: values.netRate !== "" ? Number(values.netRate) : undefined,
    price: Number(values.printRate),
    unit: values.unit || "pcs",
    status: values.status || "active",
  };
}

const UNIT_OPTIONS = ["pcs", "kg", "box", "pack", "liter", "meter"];

function formatCell(value) {
  if (value === null || value === undefined || value === "") return "—";
  return value;
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  return formatAmount("Rs", value);
}

function formatPercent(value) {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}%`;
}

function ProductFormFields({ editing, categories, onCancel }) {
  const { values, setFieldValue } = useFormikContext();
  const unitOptions = useMemo(() => {
    const options = [...UNIT_OPTIONS];
    if (values.unit && !options.includes(values.unit)) options.unshift(values.unit);
    return options;
  }, [values.unit]);

  return (
    <div className="product-form">
      <div className="product-form-head">
        <h2 className="bill-form mb-0">{editing ? "Edit product" : "Add product"}</h2>
        <div className="product-form-head-actions">
          <button type="submit" className="btn save-changes btn-compact">
            {editing ? "Update" : "Add product"}
          </button>
          {editing && (
            <button type="button" className="btn cancel btn-compact" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </div>
      <div className="product-form-grid">
        <div className="pf-field">
          <label className="form-label input-clr" htmlFor="category">Category</label>
          <Field
            id="category"
            name="category"
            list="product-categories"
            className="form-control input-settings input-compact"
            placeholder="Fash Wash"
          />
          <datalist id="product-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          <ErrorMessage name="category" component="div" className="text-danger small mb-0" />
        </div>
        <div className={`pf-field ${editing ? "pf-span-2" : ""}`}>
          <label className="form-label input-clr" htmlFor="name">Name</label>
          <Field
            id="name"
            name="name"
            className="form-control input-settings input-compact"
            placeholder="Golden Pearl"
          />
          <ErrorMessage name="name" component="div" className="text-danger small mb-0" />
        </div>
        <div className="pf-field">
          <label className="form-label input-clr" htmlFor="unit">Unit</label>
          <Field as="select" id="unit" name="unit" className="form-select input-settings input-compact">
            {unitOptions.map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </Field>
        </div>
        {!editing && (
          <div className="pf-field">
            <label className="form-label input-clr" htmlFor="stock">Stock</label>
            <Field id="stock" name="stock" type="number" min="0" className="form-control input-settings input-compact" />
            <ErrorMessage name="stock" component="div" className="text-danger small mb-0" />
          </div>
        )}

        <div className="pf-field">
          <label className="form-label input-clr" htmlFor="tpRate">TP Rate</label>
          <Field name="tpRate">
            {({ field }) => (
              <input
                {...field}
                id="tpRate"
                type="number"
                min="0"
                className="form-control input-settings input-compact"
                placeholder="500"
                onChange={(e) => applyPricing(values, setFieldValue, { tpRate: e.target.value })}
              />
            )}
          </Field>
          <ErrorMessage name="tpRate" component="div" className="text-danger small mb-0" />
        </div>
        <div className="pf-field">
          <label className="form-label input-clr" htmlFor="discountPercent">Disc %</label>
          <Field name="discountPercent">
            {({ field }) => (
              <input
                {...field}
                id="discountPercent"
                type="number"
                min="0"
                max="100"
                className="form-control input-settings input-compact"
                placeholder="10"
                onChange={(e) => applyPricing(values, setFieldValue, { discountPercent: e.target.value })}
              />
            )}
          </Field>
          <ErrorMessage name="discountPercent" component="div" className="text-danger small mb-0" />
        </div>
        <div className="pf-field">
          <label className="form-label input-clr">After disc.</label>
          <input
            readOnly
            tabIndex={-1}
            value={
              values.netRate !== "" && values.netRate != null
                ? formatAmount("Rs", values.netRate)
                : ""
            }
            placeholder="Auto"
            className="form-control input-settings input-compact input-computed"
          />
        </div>
        <div className="pf-field">
          <label className="form-label input-clr" htmlFor="printRate">Price</label>
          <Field
            id="printRate"
            name="printRate"
            type="number"
            min="0"
            className="form-control input-settings input-compact"
            placeholder="Price"
          />
          <ErrorMessage name="printRate" component="div" className="text-danger small mb-0" />
        </div>
      </div>
    </div>
  );
}

const adjustSchema = Yup.object({
  productId: Yup.string().required("Product required"),
  quantity: Yup.number()
    .integer()
    .required("Qty required")
    .test("nonzero", "Cannot be zero", (v) => v !== 0 && v != null),
  reason: Yup.string().required("Reason required"),
});

export default function StockPage() {
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState("products");

  // GET /products (RTK Query) — list below form
  const { products, isLoading } = useProducts();
  const { data: movementsData } = useGetMovementsQuery({ per_page: 30 });

  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [adjustInventory] = useAdjustInventoryMutation();

  const movements = movementsData?.movements || [];

  const categories = useMemo(
    () =>
      [...new Set(products.map((p) => p.category).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [products]
  );

  const saveProduct = async (values, { resetForm }) => {
    const payload = buildProductPayload(values);
    try {
      if (editing) {
        await updateProduct({
          id: editing.id,
          ...payload,
        }).unwrap();
        toast.success("Product updated");
        setEditing(null);
      } else {
        await createProduct({
          ...payload,
          stock: Number(values.stock),
          sku: `PRD-${Date.now().toString(36).toUpperCase()}`,
        }).unwrap();
        toast.success("Product added");
      }
      resetForm();
    } catch (err) {
      toast.error(getErrorMessage(err, "Save failed"));
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`Remove ${product.name}?`)) return;
    try {
      await deleteProduct(product.id).unwrap();
      toast.success("Product removed");
    } catch (err) {
      toast.error(getErrorMessage(err, "Delete failed"));
    }
  };

  const adjustStock = async (values, { resetForm }) => {
    try {
      await adjustInventory({
        productId: values.productId,
        quantity: Number(values.quantity),
        reason: values.reason,
      }).unwrap();
      toast.success("Stock adjusted");
      resetForm();
      setTab("movements");
    } catch (err) {
      toast.error(getErrorMessage(err, "Adjust failed"));
    }
  };

  return (
    <div className="page-wrap">
      <div className="invoices-header mb-2">
        <div>
          <h1 className="page-title mb-1">Products &amp; Stock</h1>
          <p className="count-invoices-tect mb-0">
            Add/remove products and adjust inventory
          </p>
        </div>
      </div>

      <nav className="stock-tab-nav mb-2" aria-label="Stock sections">
        {[
          { key: "products", label: "Products" },
          { key: "adjust", label: "Adjust stock" },
          { key: "movements", label: "Movements" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`stock-tab-btn ${tab === key ? "active" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "products" && (
        <>
          <Formik
            initialValues={editing ? productToFormValues(editing) : emptyProductForm}
            enableReinitialize
            validationSchema={editing ? productEditSchema : productSchema}
            onSubmit={saveProduct}
          >
            {({ resetForm }) => (
              <Form className="form-card form-card-compact mb-3">
                <ProductFormFields
                  editing={editing}
                  categories={categories}
                  onCancel={() => {
                    setEditing(null);
                    resetForm();
                  }}
                />
              </Form>
            )}
          </Formik>

          <div className="mb-2 flex items-center justify-between">
            <h2 className="product-list-heading">Products</h2>
            {!isLoading && products.length > 0 && (
              <span className="textcklr small">{products.length}</span>
            )}
          </div>

          {isLoading ? (
            <p className="textcklr">Loading…</p>
          ) : !products.length ? (
            <EmptyState title="No products" message="Add products to sell on invoices." />
          ) : (
            <div className="form-card product-list-card">
              <div className="product-table-scroll">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Name</th>
                      <th>TP Rate</th>
                      <th>Disc %</th>
                      <th>After disc.</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Unit</th>
                      <th>Status</th>
                      <th className="text-end col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.key || p.id}>
                        <td>
                          {p.category ? (
                            <span className="category-badge">{p.category}</span>
                          ) : (
                            <span className="cell-muted">—</span>
                          )}
                        </td>
                        <td className="table-text-size">{p.name}</td>
                        <td>{formatMoney(p.tpRate)}</td>
                        <td>{formatPercent(p.discountPercent)}</td>
                        <td>{formatMoney(p.netRate)}</td>
                        <td className="price">{formatMoney(p.printRate ?? p.price)}</td>
                        <td><strong>{formatCell(p.stock)}</strong></td>
                        <td className="cell-muted">{formatCell(p.unit)}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              p.status === "active" ? "active" : "inactive"
                            }`}
                          >
                            {formatCell(p.status)}
                          </span>
                        </td>
                        <td className="col-actions">
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn btn-table-edit"
                              onClick={() => setEditing(p)}
                              title="Edit product"
                            >
                              <FontAwesomeIcon icon={faPen} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-table-remove"
                              onClick={() => removeProduct(p)}
                              title="Remove product"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "adjust" && (
        <Formik
          initialValues={{ productId: "", quantity: "", reason: "" }}
          validationSchema={adjustSchema}
          onSubmit={adjustStock}
        >
          <Form className="form-card form-card-compact">
            <div className="product-form-head">
              <h2 className="bill-form mb-0">Adjust stock</h2>
              <button type="submit" className="btn save-changes btn-compact">
                Apply
              </button>
            </div>
            <p className="textcklr small mb-2">
              Positive qty = stock badhao, negative = kam karo. Reason zaroori hai.
            </p>
            <div className="product-form-grid product-form-grid-adjust">
              <div className="pf-field">
                <label className="form-label input-clr" htmlFor="productId">Product</label>
                <Field as="select" id="productId" name="productId" className="form-select input-settings input-compact">
                  <option value="">Select…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (stock {p.stock})
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="productId" component="div" className="text-danger small mb-0" />
              </div>
              <div className="pf-field">
                <label className="form-label input-clr" htmlFor="quantity">Qty (+/−)</label>
                <Field id="quantity" name="quantity" type="number" className="form-control input-settings input-compact" />
                <ErrorMessage name="quantity" component="div" className="text-danger small mb-0" />
              </div>
              <div className="pf-field">
                <label className="form-label input-clr" htmlFor="reason">Reason</label>
                <Field
                  id="reason"
                  name="reason"
                  className="form-control input-settings input-compact"
                  placeholder="e.g. Damaged, Restock"
                />
                <ErrorMessage name="reason" component="div" className="text-danger small mb-0" />
              </div>
            </div>
          </Form>
        </Formik>
      )}

      {tab === "movements" && (
        <>
          <h2 className="bill-form mb-3">Recent movements</h2>
          {!movements.length ? (
            <EmptyState title="No movements" message="Adjustments and invoice sales appear here." />
          ) : (
            <div className="flex flex-col gap-2">
              {movements.map((m) => (
                <div key={m.id} className="invoice-row datalist grid grid-cols-2 gap-2 px-2 py-2 text-sm md:grid-cols-12">
                  <div className="table-text-size md:col-span-3">{m.productName}</div>
                  <div className="textcklr md:col-span-2">{m.type}</div>
                  <div className="price md:col-span-2">
                    {m.quantity > 0 ? "+" : ""}
                    {m.quantity}
                  </div>
                  <div className="textcklr md:col-span-3">{m.reason}</div>
                  <div className="textcklr md:col-span-2">{m.createdAt?.slice(0, 10)}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
