import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ErrorMessage, Field, Form, Formik, useFormikContext } from "formik";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { Can } from "../auth/guards";
import { useAuth } from "../auth/AuthContext";
import EmptyState from "../components/ui/EmptyState";
import { useProducts } from "../hooks/useProducts";
import { PERMISSIONS } from "../lib/permissions";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import {
  useAdjustInventoryMutation,
  useCreateCategoryMutation,
  useCreateProductMutation,
  useDeleteCategoryMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useGetMovementsQuery,
  useUpdateCategoryMutation,
  useUpdateProductMutation,
} from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

const UNIT_OPTIONS = ["pcs", "kg", "box", "pack", "liter", "meter", "dozen"];

const productSchema = Yup.object({
  name: Yup.string().required("Name required"),
  sku: Yup.string().trim(),
  barcode: Yup.string().trim(),
  brand: Yup.string().trim(),
  categoryId: Yup.string(),
  unit: Yup.string().default("pcs"),
  purchasePrice: Yup.number().min(0).nullable(),
  salePrice: Yup.number().min(0).nullable(),
  wholesalePrice: Yup.number().min(0).nullable(),
  minimumStockLevel: Yup.number().integer().min(0).required("Min stock required"),
  openingStock: Yup.number().integer().min(0),
  description: Yup.string(),
  status: Yup.string().oneOf(["active", "inactive"]),
});

const productEditSchema = productSchema.omit(["openingStock"]);

const categorySchema = Yup.object({
  name: Yup.string().trim().required("Name required"),
  description: Yup.string(),
  status: Yup.string().oneOf(["active", "inactive"]),
});

const adjustSchema = Yup.object({
  productId: Yup.string().required("Product required"),
  quantity: Yup.number()
    .integer()
    .required("Qty required")
    .test("nonzero", "Cannot be zero", (v) => v !== 0 && v != null),
  reason: Yup.string().required("Reason required"),
});

const emptyProductForm = {
  name: "",
  sku: "",
  barcode: "",
  brand: "",
  categoryId: "",
  unit: "pcs",
  purchasePrice: "",
  salePrice: "",
  wholesalePrice: "",
  minimumStockLevel: 0,
  openingStock: 0,
  description: "",
  status: "active",
};

function productToFormValues(product) {
  return {
    name: product.name ?? "",
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    brand: product.brand ?? "",
    categoryId: product.categoryId != null ? String(product.categoryId) : "",
    unit: product.unit || "pcs",
    purchasePrice: product.purchasePrice ?? "",
    salePrice: product.salePrice ?? product.printRate ?? product.price ?? "",
    wholesalePrice: product.wholesalePrice ?? "",
    minimumStockLevel: product.minimumStockLevel ?? product.minStock ?? 0,
    openingStock: 0,
    description: product.description ?? "",
    status: product.status || "active",
  };
}

function buildProductPayload(values) {
  const payload = {
    name: values.name.trim(),
    sku: values.sku?.trim() || null,
    barcode: values.barcode?.trim() || null,
    brand: values.brand?.trim() || null,
    categoryId: values.categoryId ? Number(values.categoryId) : null,
    unit: values.unit || "pcs",
    purchasePrice:
      values.purchasePrice === "" || values.purchasePrice == null
        ? null
        : Number(values.purchasePrice),
    salePrice:
      values.salePrice === "" || values.salePrice == null
        ? null
        : Number(values.salePrice),
    wholesalePrice:
      values.wholesalePrice === "" || values.wholesalePrice == null
        ? null
        : Number(values.wholesalePrice),
    minimumStockLevel: Number(values.minimumStockLevel) || 0,
    description: values.description?.trim() || null,
    status: values.status || "active",
  };
  return payload;
}

function formatCell(value) {
  if (value === null || value === undefined || value === "") return "—";
  return value;
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  return formatAmount("Rs", value);
}

function formatMovementType(type) {
  if (!type) return "—";
  return String(type)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ProductFormFields({ editing, categories, onCancel }) {
  const { values } = useFormikContext();
  const unitOptions = useMemo(() => {
    const options = [...UNIT_OPTIONS];
    if (values.unit && !options.includes(values.unit)) options.unshift(values.unit);
    return options;
  }, [values.unit]);

  return (
    <div className="row g-3">
      <div className="col-12 col-md-4">
        <label className="form-label input-clr mb-1" htmlFor="name">Name</label>
        <Field id="name" name="name" className="form-control input-settings input-compact" />
        <ErrorMessage name="name" component="div" className="text-danger small" />
      </div>
      <div className="col-6 col-md-2">
        <label className="form-label input-clr mb-1" htmlFor="sku">SKU</label>
        <Field id="sku" name="sku" className="form-control input-settings input-compact" />
      </div>
      <div className="col-6 col-md-2">
        <label className="form-label input-clr mb-1" htmlFor="barcode">Barcode</label>
        <Field id="barcode" name="barcode" className="form-control input-settings input-compact" />
      </div>
      <div className="col-6 col-md-2">
        <label className="form-label input-clr mb-1" htmlFor="brand">Brand</label>
        <Field id="brand" name="brand" className="form-control input-settings input-compact" />
      </div>
      <div className="col-6 col-md-2">
        <label className="form-label input-clr mb-1" htmlFor="unit">Unit</label>
        <Field as="select" id="unit" name="unit" className="form-select input-settings input-compact">
          {unitOptions.map((unit) => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </Field>
      </div>

      <div className="col-6 col-md-3">
        <label className="form-label input-clr mb-1" htmlFor="categoryId">Category</label>
        <Field as="select" id="categoryId" name="categoryId" className="form-select input-settings input-compact">
          <option value="">None</option>
          {categories
            .filter((c) => c.status !== "inactive")
            .map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </Field>
      </div>
      <div className="col-6 col-md-3">
        <label className="form-label input-clr mb-1" htmlFor="purchasePrice">Purchase price</label>
        <Field id="purchasePrice" name="purchasePrice" type="number" min="0" className="form-control input-settings input-compact" />
      </div>
      <div className="col-6 col-md-3">
        <label className="form-label input-clr mb-1" htmlFor="salePrice">Sale price</label>
        <Field id="salePrice" name="salePrice" type="number" min="0" className="form-control input-settings input-compact" />
      </div>
      <div className="col-6 col-md-3">
        <label className="form-label input-clr mb-1" htmlFor="wholesalePrice">Wholesale price</label>
        <Field id="wholesalePrice" name="wholesalePrice" type="number" min="0" className="form-control input-settings input-compact" />
      </div>

      <div className="col-6 col-md-2">
        <label className="form-label input-clr mb-1" htmlFor="minimumStockLevel">Min stock</label>
        <Field id="minimumStockLevel" name="minimumStockLevel" type="number" min="0" className="form-control input-settings input-compact" />
        <ErrorMessage name="minimumStockLevel" component="div" className="text-danger small" />
      </div>
      {!editing && (
        <div className="col-6 col-md-2">
          <label className="form-label input-clr mb-1" htmlFor="openingStock">Opening stock</label>
          <Field id="openingStock" name="openingStock" type="number" min="0" className="form-control input-settings input-compact" />
        </div>
      )}
      <div className="col-6 col-md-2">
        <label className="form-label input-clr mb-1" htmlFor="status">Status</label>
        <Field as="select" id="status" name="status" className="form-select input-settings input-compact">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Field>
      </div>
      <div className="col-12 col-md-6">
        <label className="form-label input-clr mb-1" htmlFor="description">Description</label>
        <Field id="description" name="description" className="form-control input-settings input-compact" />
      </div>

      <div className="col-12 d-flex flex-wrap gap-2 pt-1">
        <button type="submit" className="btn save-changes py-2 px-4">
          {editing ? "Update" : "Add product"}
        </button>
        {editing && (
          <button type="button" className="btn cancel py-2 px-3" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function StockPage() {
  const [editing, setEditing] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [tab, setTab] = useState("products");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const { can } = useAuth();
  const canShowProductForm = editing
    ? can(PERMISSIONS.PRODUCTS_UPDATE)
    : can(PERMISSIONS.PRODUCTS_CREATE);

  const productQueryParams = useMemo(() => {
    const params = {};
    if (search.trim()) params.q = search.trim();
    if (categoryFilter) params.categoryId = categoryFilter;
    if (statusFilter) params.status = statusFilter;
    if (lowStockOnly) params.lowStock = "true";
    return params;
  }, [search, categoryFilter, statusFilter, lowStockOnly]);

  const { products, isLoading } = useProducts(productQueryParams);
  const { data: categoriesData } = useGetCategoriesQuery();
  const categories = categoriesData?.categories || [];

  const { data: movementsData } = useGetMovementsQuery(
    selectedProductId ? { productId: selectedProductId } : {},
    { skip: tab !== "movements" && !selectedProductId }
  );
  const movements = movementsData?.movements || [];

  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [adjustInventory] = useAdjustInventoryMutation();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [editingCategory, setEditingCategory] = useState(null);

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(selectedProductId)),
    [products, selectedProductId]
  );

  const saveProduct = async (values, { resetForm }) => {
    const payload = buildProductPayload(values);
    try {
      if (editing) {
        await updateProduct({ id: editing.id, ...payload }).unwrap();
        toast.success("Product updated");
        setEditing(null);
      } else {
        await createProduct({
          ...payload,
          openingStock: Number(values.openingStock) || 0,
          sku:
            payload.sku ||
            `PRD-${Date.now().toString(36).toUpperCase()}`,
        }).unwrap();
        toast.success("Product added");
      }
      resetForm();
    } catch (err) {
      toast.error(getErrorMessage(err, "Save failed"));
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`Archive ${product.name}?`)) return;
    try {
      await deleteProduct(product.id).unwrap();
      toast.success("Product archived");
      if (String(selectedProductId) === String(product.id)) setSelectedProductId("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Delete failed"));
    }
  };

  const adjustStock = async (values, { resetForm }) => {
    try {
      await adjustInventory({
        productId: Number(values.productId),
        quantity: Number(values.quantity),
        reason: values.reason,
      }).unwrap();
      toast.success("Stock adjusted");
      resetForm();
      setSelectedProductId(String(values.productId));
      setTab("movements");
    } catch (err) {
      toast.error(getErrorMessage(err, "Adjust failed"));
    }
  };

  const saveCategory = async (values, { resetForm }) => {
    try {
      if (editingCategory) {
        await updateCategory({
          id: editingCategory.id,
          name: values.name.trim(),
          description: values.description?.trim() || null,
          status: values.status,
        }).unwrap();
        toast.success("Category updated");
        setEditingCategory(null);
      } else {
        await createCategory({
          name: values.name.trim(),
          description: values.description?.trim() || null,
          status: values.status || "active",
        }).unwrap();
        toast.success("Category created");
      }
      resetForm();
    } catch (err) {
      toast.error(getErrorMessage(err, "Category save failed"));
    }
  };

  const removeCategory = async (category) => {
    if (!window.confirm(`Remove category ${category.name}?`)) return;
    try {
      const result = await deleteCategory(category.id).unwrap();
      toast.success(result?.archived ? "Category archived" : "Category deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Category delete failed"));
    }
  };

  const tabs = [
    { key: "products", label: "Products" },
    {
      key: "categories",
      label: "Categories",
      permission: PERMISSIONS.CATEGORIES_VIEW,
    },
    {
      key: "adjust",
      label: "Adjust stock",
      permission: PERMISSIONS.INVENTORY_ADJUST,
    },
    {
      key: "movements",
      label: "Stock history",
      permission: PERMISSIONS.INVENTORY_VIEW,
    },
  ];

  return (
    <div className="page-wrap">
      <div className="invoices-header mb-3">
        <div>
          <h1 className="page-title mb-1">Products &amp; Stock</h1>
          <p className="count-invoices-tect mb-0">
            Catalog, categories, and stock ledger
          </p>
        </div>
      </div>

      <nav className="stock-tab-nav mb-4" aria-label="Stock sections">
        {tabs.map(({ key, label, permission }) =>
          permission ? (
            <Can key={key} permission={permission}>
              <button
                type="button"
                className={`stock-tab-btn ${tab === key ? "active" : ""}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            </Can>
          ) : (
            <button
              key={key}
              type="button"
              className={`stock-tab-btn ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          )
        )}
      </nav>

      {tab === "products" && (
        <>
          {canShowProductForm && (
            <Formik
              initialValues={editing ? productToFormValues(editing) : emptyProductForm}
              enableReinitialize
              validationSchema={editing ? productEditSchema : productSchema}
              onSubmit={saveProduct}
            >
              {({ resetForm }) => (
                <Form className="form-card form-card-compact mb-3">
                  <h2 className="bill-form mb-3">{editing ? "Edit product" : "Add product"}</h2>
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
          )}

          <div className="form-card form-card-compact mb-3">
            <div className="row g-2 align-items-end">
              <div className="col-12 col-md-4">
                <label className="form-label input-clr mb-1">Search</label>
                <input
                  className="form-control input-settings input-compact"
                  placeholder="Name, SKU, barcode…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label input-clr mb-1">Category</label>
                <select
                  className="form-select input-settings input-compact"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label input-clr mb-1">Status</label>
                <select
                  className="form-select input-settings input-compact"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="">All</option>
                </select>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-check d-flex align-items-center gap-2 mb-0 mt-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={lowStockOnly}
                    onChange={(e) => setLowStockOnly(e.target.checked)}
                  />
                  <span className="input-clr">Low stock only</span>
                </label>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between mb-2">
            <h2 className="page-title mb-0">Products</h2>
            {!isLoading && products.length > 0 && (
              <span className="textcklr small">{products.length}</span>
            )}
          </div>

          {isLoading ? (
            <p className="textcklr">Loading…</p>
          ) : !products.length ? (
            <EmptyState title="No products" message="Add products to manage stock." />
          ) : (
            <div className="form-card product-list-card">
              <div className="product-table-scroll">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Sale</th>
                      <th>Stock</th>
                      <th>Min</th>
                      <th>Status</th>
                      <th className="text-end col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.key || p.id}>
                        <td className="table-text-size">
                          <button
                            type="button"
                            className="btn btn-link p-0 text-decoration-none"
                            onClick={() => {
                              setSelectedProductId(String(p.id));
                              setTab("movements");
                            }}
                          >
                            {p.name}
                          </button>
                          {p.brand ? (
                            <div className="cell-muted small">{p.brand}</div>
                          ) : null}
                        </td>
                        <td className="cell-muted">{formatCell(p.sku)}</td>
                        <td>
                          {p.category ? (
                            <span className="category-badge">{p.category}</span>
                          ) : (
                            <span className="cell-muted">—</span>
                          )}
                        </td>
                        <td className="price">{formatMoney(p.salePrice)}</td>
                        <td><strong>{formatCell(p.currentStock)}</strong></td>
                        <td className="cell-muted">{formatCell(p.minimumStockLevel)}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              p.stockStatus === "LOW_STOCK"
                                ? "inactive"
                                : p.status === "active"
                                  ? "active"
                                  : "inactive"
                            }`}
                          >
                            {p.stockStatus === "LOW_STOCK"
                              ? "Low stock"
                              : formatCell(p.status)}
                          </span>
                        </td>
                        <td className="col-actions">
                          <div className="table-actions">
                            <Can permission={PERMISSIONS.PRODUCTS_UPDATE}>
                              <button
                                type="button"
                                className="btn btn-table-edit"
                                onClick={() => setEditing(p)}
                                title="Edit product"
                              >
                                <FontAwesomeIcon icon={faPen} />
                                Edit
                              </button>
                            </Can>
                            <Can permission={PERMISSIONS.PRODUCTS_DELETE}>
                              <button
                                type="button"
                                className="btn btn-table-remove"
                                onClick={() => removeProduct(p)}
                                title="Archive product"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                                Archive
                              </button>
                            </Can>
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

      {tab === "categories" && (
        <>
          <Can permission={PERMISSIONS.CATEGORIES_CREATE}>
            <Formik
              initialValues={
                editingCategory
                  ? {
                      name: editingCategory.name || "",
                      description: editingCategory.description || "",
                      status: editingCategory.status || "active",
                    }
                  : { name: "", description: "", status: "active" }
              }
              enableReinitialize
              validationSchema={categorySchema}
              onSubmit={saveCategory}
            >
              {({ resetForm }) => (
                <Form className="form-card form-card-compact mb-3">
                  <h2 className="bill-form mb-3">
                    {editingCategory ? "Edit category" : "Add category"}
                  </h2>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label input-clr mb-1">Name</label>
                      <Field name="name" className="form-control input-settings input-compact" />
                      <ErrorMessage name="name" component="div" className="text-danger small" />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label input-clr mb-1">Description</label>
                      <Field name="description" className="form-control input-settings input-compact" />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label input-clr mb-1">Status</label>
                      <Field as="select" name="status" className="form-select input-settings input-compact">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Field>
                    </div>
                    <div className="col-12 d-flex gap-2">
                      <button type="submit" className="btn save-changes py-2 px-4">
                        {editingCategory ? "Update" : "Add category"}
                      </button>
                      {editingCategory && (
                        <button
                          type="button"
                          className="btn cancel py-2 px-3"
                          onClick={() => {
                            setEditingCategory(null);
                            resetForm();
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </Can>

          {!categories.length ? (
            <EmptyState title="No categories" message="Create categories to organize products." />
          ) : (
            <div className="form-card product-list-card">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th className="text-end col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td className="table-text-size">{c.name}</td>
                      <td className="cell-muted">{formatCell(c.description)}</td>
                      <td>
                        <span className={`status-badge ${c.status === "active" ? "active" : "inactive"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="table-actions">
                          <Can permission={PERMISSIONS.CATEGORIES_UPDATE}>
                            <button
                              type="button"
                              className="btn btn-table-edit"
                              onClick={() => setEditingCategory(c)}
                            >
                              <FontAwesomeIcon icon={faPen} />
                              Edit
                            </button>
                          </Can>
                          <Can permission={PERMISSIONS.CATEGORIES_DELETE}>
                            <button
                              type="button"
                              className="btn btn-table-remove"
                              onClick={() => removeCategory(c)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                              Remove
                            </button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "adjust" && (
        <Formik
          initialValues={{ productId: selectedProductId || "", quantity: "", reason: "" }}
          enableReinitialize
          validationSchema={adjustSchema}
          onSubmit={adjustStock}
        >
          <Form className="form-card">
            <h2 className="bill-form mb-3">Adjust stock</h2>
            <p className="textcklr small">
              Positive qty increases stock, negative decreases. Reason is required.
              Changes are written to the stock ledger (not via product edit).
            </p>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="input-clr mb-1">Product</label>
                <Field as="select" name="productId" className="form-select input-settings">
                  <option value="">Select…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (stock {p.currentStock})
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="productId" component="div" className="text-danger" />
              </div>
              <div className="col-6 col-md-3">
                <label className="input-clr mb-1">Quantity (+/−)</label>
                <Field name="quantity" type="number" className="form-control input-settings" />
                <ErrorMessage name="quantity" component="div" className="text-danger" />
              </div>
              <div className="col-6 col-md-5">
                <label className="input-clr mb-1">Reason</label>
                <Field
                  name="reason"
                  className="form-control input-settings"
                  placeholder="e.g. Damaged goods"
                />
                <ErrorMessage name="reason" component="div" className="text-danger" />
              </div>
              <div className="col-12">
                <button type="submit" className="btn save-changes py-2 px-4">
                  Apply adjustment
                </button>
              </div>
            </div>
          </Form>
        </Formik>
      )}

      {tab === "movements" && (
        <>
          <div className="form-card form-card-compact mb-3">
            <div className="row g-2 align-items-end">
              <div className="col-md-6">
                <label className="form-label input-clr mb-1">Product</label>
                <select
                  className="form-select input-settings input-compact"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">All recent movements</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedProduct && (
                <div className="col-md-6">
                  <div className="small textcklr">
                    Current stock: <strong>{selectedProduct.currentStock}</strong>
                    {" · "}
                    Min: {selectedProduct.minimumStockLevel}
                    {" · "}
                    {selectedProduct.stockStatus === "LOW_STOCK" ? "Low stock" : "OK"}
                  </div>
                </div>
              )}
            </div>
          </div>

          <h2 className="bill-form mb-3">Stock history</h2>
          {!movements.length ? (
            <EmptyState
              title="No movements"
              message="Opening stock and adjustments appear here."
            />
          ) : (
            <div className="form-card product-list-card">
              <div className="product-table-scroll">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Reference / reason</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={`${m.id}-${m.createdAt}`}>
                        <td className="cell-muted">
                          {m.createdAt ? String(m.createdAt).slice(0, 10) : "—"}
                        </td>
                        <td className="table-text-size">{m.productName || m.productId}</td>
                        <td>{formatMovementType(m.movementType || m.type)}</td>
                        <td className="price">
                          {m.quantity > 0 ? "+" : ""}
                          {m.quantity}
                        </td>
                        <td className="cell-muted">
                          {m.reason ||
                            (m.referenceType
                              ? `${m.referenceType}${m.referenceId ? ` #${m.referenceId}` : ""}`
                              : "—")}
                        </td>
                        <td>
                          <strong>
                            {m.balanceAfter ?? m.resultingQuantity ?? "—"}
                          </strong>
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
    </div>
  );
}
