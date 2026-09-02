import { ErrorMessage, Field, Form, Formik } from "formik";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { inventoryApi, productsApi } from "../api/endpoints";
import EmptyState from "../components/ui/EmptyState";
import { ApiError } from "../lib/apiClient";
import { formatAmount } from "../utils/invoice";

const productSchema = Yup.object({
  sku: Yup.string().required("SKU required"),
  name: Yup.string().required("Name required"),
  price: Yup.number().min(0).required("Price required"),
  stock: Yup.number().integer().min(0).required("Stock required"),
  unit: Yup.string().default("pcs"),
});

const adjustSchema = Yup.object({
  productId: Yup.string().required("Product required"),
  quantity: Yup.number().integer().required("Qty required").test(
    "nonzero",
    "Cannot be zero",
    (v) => v !== 0 && v != null
  ),
  reason: Yup.string().required("Reason required"),
});

export default function StockPage() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState("products");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prodData, movData] = await Promise.all([
        productsApi.list({ per_page: 100 }),
        inventoryApi.movements({ per_page: 30 }),
      ]);
      setProducts(prodData.products || []);
      setMovements(movData.movements || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load stock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveProduct = async (values, { resetForm }) => {
    try {
      if (editing) {
        await productsApi.update({
          id: editing.id,
          sku: values.sku,
          name: values.name,
          price: Number(values.price),
          unit: values.unit || "pcs",
          status: values.status || "active",
        });
        toast.success("Product updated");
        setEditing(null);
      } else {
        await productsApi.create({
          ...values,
          price: Number(values.price),
          stock: Number(values.stock),
        });
        toast.success("Product added");
      }
      resetForm();
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`Remove ${product.name}?`)) return;
    try {
      await productsApi.remove(product.id);
      toast.success("Product removed");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  const adjustStock = async (values, { resetForm }) => {
    try {
      await inventoryApi.adjust({
        productId: values.productId,
        quantity: Number(values.quantity),
        reason: values.reason,
      });
      toast.success("Stock adjusted");
      resetForm();
      await load();
      setTab("movements");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Adjust failed");
    }
  };

  return (
    <div className="page-wrap">
      <div className="invoices-header mb-3">
        <div>
          <h1 className="page-title mb-1">Products &amp; Stock</h1>
          <p className="count-invoices-tect mb-0">
            Add/remove products and adjust inventory
          </p>
        </div>
      </div>

      <div className="d-flex gap-2 mb-4">
        {["products", "adjust", "movements"].map((key) => (
          <button
            key={key}
            type="button"
            className={`btn py-2 px-3 ${tab === key ? "save-changes" : "cancel"}`}
            onClick={() => setTab(key)}
          >
            {key === "products" ? "Products" : key === "adjust" ? "Adjust stock" : "Movements"}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <>
          <Formik
            initialValues={
              editing
                ? {
                    sku: editing.sku,
                    name: editing.name,
                    price: editing.price,
                    stock: editing.stock,
                    unit: editing.unit || "pcs",
                    status: editing.status,
                  }
                : { sku: "", name: "", price: "", stock: 0, unit: "pcs", status: "active" }
            }
            enableReinitialize
            validationSchema={productSchema}
            onSubmit={saveProduct}
          >
            {({ resetForm }) => (
              <Form className="form-card mb-4">
                <h2 className="bill-form mb-3">{editing ? "Edit product" : "Add product"}</h2>
                <div className="row g-3">
                  <div className="col-6 col-md-3">
                    <label className="input-clr mb-1">SKU</label>
                    <Field name="sku" className="form-control input-settings" disabled={!!editing} />
                    <ErrorMessage name="sku" component="div" className="text-danger" />
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="input-clr mb-1">Name</label>
                    <Field name="name" className="form-control input-settings" />
                    <ErrorMessage name="name" component="div" className="text-danger" />
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="input-clr mb-1">Price (Rs)</label>
                    <Field name="price" type="number" className="form-control input-settings" />
                    <ErrorMessage name="price" component="div" className="text-danger" />
                  </div>
                  {!editing && (
                    <div className="col-6 col-md-2">
                      <label className="input-clr mb-1">Opening stock</label>
                      <Field name="stock" type="number" className="form-control input-settings" />
                      <ErrorMessage name="stock" component="div" className="text-danger" />
                    </div>
                  )}
                  <div className="col-6 col-md-2">
                    <label className="input-clr mb-1">Unit</label>
                    <Field name="unit" className="form-control input-settings" />
                  </div>
                  <div className="col-12 d-flex gap-2">
                    <button type="submit" className="btn save-changes py-2 px-4">
                      {editing ? "Update" : "Add product"}
                    </button>
                    {editing && (
                      <button
                        type="button"
                        className="btn cancel py-2 px-3"
                        onClick={() => {
                          setEditing(null);
                          resetForm();
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                {editing && (
                  <p className="textcklr small mt-2 mb-0">
                    Stock change ke liye &quot;Adjust stock&quot; tab use karo (ledger clean rahe).
                  </p>
                )}
              </Form>
            )}
          </Formik>

          {loading ? (
            <p className="textcklr">Loading…</p>
          ) : !products.length ? (
            <EmptyState title="No products" message="Add products to sell on invoices." />
          ) : (
            <div className="d-flex flex-column gap-2">
              {products.map((p) => (
                <div key={p.id} className="row align-items-center invoice-row datalist py-3 px-2 m-0">
                  <div className="col-6 col-md-2 table-text-size">
                    <span className="hash-clr">#</span>
                    {p.sku}
                  </div>
                  <div className="col-6 col-md-3 table-text-size">{p.name}</div>
                  <div className="col-4 col-md-2 price">{formatAmount("Rs", p.price)}</div>
                  <div className="col-4 col-md-2 textcklr">
                    Stock: <strong>{p.stock}</strong> {p.unit}
                  </div>
                  <div className="col-4 col-md-3 d-flex gap-2 justify-content-end">
                    <button type="button" className="btn edit py-1 px-3" onClick={() => setEditing(p)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn cancel py-1 px-3"
                      onClick={() => removeProduct(p)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
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
          <Form className="form-card">
            <h2 className="bill-form mb-3">Adjust stock</h2>
            <p className="textcklr small">
              Positive qty = stock badhao, negative = kam karo. Reason zaroori hai.
            </p>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="input-clr mb-1">Product</label>
                <Field as="select" name="productId" className="form-select input-settings">
                  <option value="">Select…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (stock {p.stock})
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
                <Field name="reason" className="form-control input-settings" placeholder="e.g. Damaged, Restock" />
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
          <h2 className="bill-form mb-3">Recent movements</h2>
          {!movements.length ? (
            <EmptyState title="No movements" message="Adjustments and invoice sales appear here." />
          ) : (
            <div className="d-flex flex-column gap-2">
              {movements.map((m) => (
                <div key={m.id} className="row invoice-row datalist py-2 px-2 m-0 small">
                  <div className="col-md-3 table-text-size">{m.productName}</div>
                  <div className="col-md-2 textcklr">{m.type}</div>
                  <div className="col-md-2 price">
                    {m.quantity > 0 ? "+" : ""}
                    {m.quantity}
                  </div>
                  <div className="col-md-3 textcklr">{m.reason}</div>
                  <div className="col-md-2 textcklr">{m.createdAt?.slice(0, 10)}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
