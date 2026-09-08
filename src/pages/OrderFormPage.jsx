import { faAngleLeft, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import * as Yup from "yup";
import EmptyState from "../components/ui/EmptyState";
import { useClients } from "../hooks/useClients";
import { useProducts } from "../hooks/useProducts";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import {
  useCreateOrderMutation,
  useGetOrderQuery,
  useGetSalesmenQuery,
  useGetVisitsQuery,
  useUpdateOrderMutation,
} from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

const schema = Yup.object({
  clientId: Yup.string().required("Customer required"),
  salesmanId: Yup.string().required("Salesman required"),
  visitId: Yup.string(),
  notes: Yup.string().max(500),
});

function emptyLine() {
  return {
    key: Math.random().toString(36).slice(2),
    productId: "",
    variantId: "",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    tax: 0,
  };
}

function calcLine(line) {
  const quantity = Number(line.quantity) || 0;
  const unitPrice = Number(line.unitPrice) || 0;
  const discount = Number(line.discount) || 0;
  const tax = Number(line.tax) || 0;
  const gross = quantity * unitPrice;
  return Math.round((gross - discount + tax) * 100) / 100;
}

export default function OrderFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { clients } = useClients();
  const { products } = useProducts({ status: "active", limit: 100 });
  const { data: salesmenData } = useGetSalesmenQuery({ status: "ACTIVE", limit: 100 });
  const salesmen = salesmenData?.salesmen || [];

  const {
    data,
    isLoading,
    isError,
    error,
  } = useGetOrderQuery(id, { skip: !isEdit });
  const [createOrder] = useCreateOrderMutation();
  const [updateOrder] = useUpdateOrderMutation();

  const order = data?.order;
  const [lines, setLines] = useState([emptyLine()]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedSalesmanId, setSelectedSalesmanId] = useState("");

  const visitParams = { limit: 50 };
  if (selectedClientId) visitParams.customerId = selectedClientId;
  if (selectedSalesmanId) visitParams.salesmanId = selectedSalesmanId;
  const { data: visitsData } = useGetVisitsQuery(visitParams, {
    skip: !selectedClientId || !selectedSalesmanId,
  });
  const visits = visitsData?.visits || [];

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Order not found"));
  }, [isError, error]);

  useEffect(() => {
    if (order?.items?.length) {
      setLines(
        order.items.map((item) => ({
          key: Math.random().toString(36).slice(2),
          productId: item.productId != null ? String(item.productId) : "",
          variantId: item.variantId != null ? String(item.variantId) : "",
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? 0,
          discount: item.discount ?? 0,
          tax: item.tax ?? 0,
        }))
      );
    }
    if (order) {
      const clientId =
        order.clientId != null
          ? String(order.clientId)
          : order.customerId != null
            ? String(order.customerId)
            : "";
      setSelectedClientId(clientId);
      setSelectedSalesmanId(order.salesmanId != null ? String(order.salesmanId) : "");
    }
  }, [order]);

  const preview = useMemo(() => {
    const lineTotals = lines.map(calcLine);
    const linesSubtotal = lineTotals.reduce((sum, t, i) => {
      const qty = Number(lines[i].quantity) || 0;
      const price = Number(lines[i].unitPrice) || 0;
      return sum + qty * price;
    }, 0);
    const linesDiscount = lines.reduce((s, l) => s + (Number(l.discount) || 0), 0);
    const linesTax = lines.reduce((s, l) => s + (Number(l.tax) || 0), 0);
    return {
      lineTotals,
      subtotal: Math.round(linesSubtotal * 100) / 100,
      discount: Math.round(linesDiscount * 100) / 100,
      tax: Math.round(linesTax * 100) / 100,
      grandTotal: Math.round((linesSubtotal - linesDiscount + linesTax) * 100) / 100,
    };
  }, [lines]);

  if (isEdit && isLoading) {
    return (
      <div className="page-wrap">
        <p className="textcklr">Loading…</p>
      </div>
    );
  }

  if (isEdit && !order) {
    return (
      <EmptyState title="Order not found" message="This order does not exist or was deleted." />
    );
  }

  const statusUpper = String(order?.status || "").toUpperCase();
  if (isEdit && statusUpper !== "DRAFT") {
    return (
      <div className="page-wrap">
        <EmptyState
          title="Order cannot be edited"
          message={`Only DRAFT orders can be edited (current: ${order.status}).`}
        />
        <Link to={`/orders/${id}`} className="btn edit py-2 px-3">
          View order
        </Link>
      </div>
    );
  }

  const initialValues = {
    clientId:
      order?.clientId != null
        ? String(order.clientId)
        : order?.customerId != null
          ? String(order.customerId)
          : "",
    salesmanId: order?.salesmanId != null ? String(order.salesmanId) : "",
    visitId: order?.visitId != null ? String(order.visitId) : "",
    notes: order?.notes || "",
  };

  const updateLine = (key, patch) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const onProductChange = (key, productId) => {
    const product = products.find((p) => String(p.id) === String(productId));
    updateLine(key, {
      productId,
      unitPrice: product?.salePrice ?? product?.price ?? 0,
    });
  };

  const saveDraft = async (values) => {
    const items = lines
      .filter((line) => line.productId)
      .map((line) => ({
        productId: Number(line.productId),
        ...(line.variantId !== "" && line.variantId != null
          ? { variantId: Number(line.variantId) }
          : {}),
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        discount: Number(line.discount) || 0,
        tax: Number(line.tax) || 0,
      }));

    if (!items.length) {
      toast.error("Add at least one product line");
      return;
    }

    const payload = {
      clientId: Number(values.clientId),
      customerId: Number(values.clientId),
      salesmanId: Number(values.salesmanId),
      visitId: values.visitId ? Number(values.visitId) : undefined,
      notes: values.notes || undefined,
      items,
    };

    try {
      if (isEdit) {
        await updateOrder({ id, ...payload }).unwrap();
        toast.success("Order updated");
        navigate(`/orders/${id}`);
      } else {
        const result = await createOrder(payload).unwrap();
        toast.success("Draft saved");
        navigate(`/orders/${result.order?.id ?? result.id}`);
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
        onClick={() => navigate(isEdit ? `/orders/${id}` : "/orders")}
      >
        <FontAwesomeIcon className="icon me-2" icon={faAngleLeft} size="2xs" />
        Go back
      </button>

      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={schema}
        onSubmit={saveDraft}
      >
        {({ values, setFieldValue }) => (
          <Form className="form-card">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h1 className="page-title mb-0">
                {isEdit ? "Edit Order" : "New Order"}
              </h1>
              <span className="btn pendingbtn px-3 py-1" style={{ fontSize: "12px" }}>
                ORDER
              </span>
              <span className="btn draftbtn px-3 py-1" style={{ fontSize: "12px" }}>
                Draft
              </span>
            </div>
            <p className="textcklr small mb-3">
              Orders do not affect stock or customer balance. Convert to an invoice when ready.
            </p>

            <div className="mb-4 grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="clientId">
                  Customer
                </label>
                <Field
                  as="select"
                  name="clientId"
                  id="clientId"
                  className="form-select input-settings"
                  onChange={(e) => {
                    setFieldValue("clientId", e.target.value);
                    setFieldValue("visitId", "");
                    setSelectedClientId(e.target.value);
                  }}
                >
                  <option value="">Select customer…</option>
                  {clients.map((c) => (
                    <option key={c.key || c.id} value={String(c.id)}>
                      {c.name}
                      {c.email ? ` (${c.email})` : ""}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="clientId" component="div" className="text-red-600" />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="salesmanId">
                  Salesman
                </label>
                <Field
                  as="select"
                  name="salesmanId"
                  id="salesmanId"
                  className="form-select input-settings"
                  onChange={(e) => {
                    setFieldValue("salesmanId", e.target.value);
                    setFieldValue("visitId", "");
                    setSelectedSalesmanId(e.target.value);
                  }}
                >
                  <option value="">Select salesman…</option>
                  {salesmen.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.displayName}
                      {s.employeeCode ? ` (${s.employeeCode})` : ""}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="salesmanId" component="div" className="text-red-600" />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="visitId">
                  Visit (optional)
                </label>
                <Field
                  as="select"
                  name="visitId"
                  id="visitId"
                  className="form-select input-settings"
                  disabled={!values.clientId || !values.salesmanId}
                >
                  <option value="">None</option>
                  {visits.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      #{v.id}
                      {v.visitDate
                        ? ` — ${new Date(v.visitDate).toLocaleDateString()}`
                        : ""}
                      {v.purpose ? ` (${v.purpose})` : ""}
                    </option>
                  ))}
                </Field>
              </div>
              <div className="col-span-12">
                <label className="form-label input-clr" htmlFor="notes">
                  Notes
                </label>
                <Field name="notes" id="notes" className="form-control input-settings" />
              </div>
            </div>

            <h2 className="page-title mb-3">Line items</h2>
            <div className="mb-3 flex flex-col gap-3">
              {lines.map((line, index) => (
                <div
                  key={line.key}
                  className="invoice-row datalist m-0 grid grid-cols-12 items-end gap-2 px-2 py-3"
                >
                  <div className="col-span-12 md:col-span-3">
                    <label className="form-label input-clr">Product</label>
                    <select
                      className="form-select input-settings"
                      value={line.productId}
                      onChange={(e) => onProductChange(line.key, e.target.value)}
                    >
                      <option value="">Select product…</option>
                      {products.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name}
                          {p.sku ? ` (${p.sku})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-6 md:col-span-1">
                    <label className="form-label input-clr">Variant</label>
                    <input
                      type="number"
                      className="form-control input-settings"
                      value={line.variantId}
                      onChange={(e) => updateLine(line.key, { variantId: e.target.value })}
                      placeholder="—"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-1">
                    <label className="form-label input-clr">Qty</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-control input-settings"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <label className="form-label input-clr">Unit Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control input-settings"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-1">
                    <label className="form-label input-clr">Disc.</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control input-settings"
                      value={line.discount}
                      onChange={(e) => updateLine(line.key, { discount: e.target.value })}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-1">
                    <label className="form-label input-clr">Tax</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control input-settings"
                      value={line.tax}
                      onChange={(e) => updateLine(line.key, { tax: e.target.value })}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <label className="form-label input-clr">Line total</label>
                    <div className="price py-2">{formatAmount("Rs", preview.lineTotals[index])}</div>
                  </div>
                  <div className="col-span-6 flex justify-end md:col-span-1">
                    <button
                      type="button"
                      className="btn cancel px-2 py-1"
                      disabled={lines.length <= 1}
                      onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                      aria-label="Remove line"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn edit mb-4 px-3 py-2"
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
            >
              Add line
            </button>

            <div className="detail-card mb-4">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-6 md:col-span-3">
                  <span className="edit-discription block">Subtotal</span>
                  <span className="price block">{formatAmount("Rs", preview.subtotal)}</span>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <span className="edit-discription block">Discount</span>
                  <span className="price block">{formatAmount("Rs", preview.discount)}</span>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <span className="edit-discription block">Tax</span>
                  <span className="price block">{formatAmount("Rs", preview.tax)}</span>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <span className="edit-discription block">Grand Total</span>
                  <span className="price block">{formatAmount("Rs", preview.grandTotal)}</span>
                </div>
              </div>
              <p className="textcklr small mb-0 mt-2">Client preview — server recalculates on save.</p>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn input-clr1 save-changes px-4 py-2">
                Save Draft
              </button>
              <button
                type="button"
                className="btn cancel px-3 py-2"
                onClick={() => navigate(isEdit ? `/orders/${id}` : "/orders")}
              >
                Cancel
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
