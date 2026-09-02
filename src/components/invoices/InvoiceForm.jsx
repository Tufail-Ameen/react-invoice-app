import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useState } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { getErrorMessage } from "../../lib/rtkBaseQuery";
import { useClients } from "../../hooks/useClients";
import {
  useCreateInvoiceMutation,
  useGetProductsQuery,
  useUpdateInvoiceMutation,
  useUpdateInvoiceStatusMutation,
} from "../../services/invoiceApi";
import { calcLineTotal } from "../../utils/invoice";

const schema = Yup.object({
  clientId: Yup.string().required("Client required"),
  issueDate: Yup.string().required("Date required"),
  dueDate: Yup.string().required("Due date required"),
  description: Yup.string(),
  currency: Yup.string().required(),
});

function emptyLine() {
  return { key: Math.random().toString(36).slice(2), productId: "", quantity: 1, tax: 0 };
}

export default function InvoiceForm({ invoice, onClose, onSaved }) {
  const { clients } = useClients();
  const { data: productsData } = useGetProductsQuery({ per_page: 100, status: "active" });
  const [createInvoice] = useCreateInvoiceMutation();
  const [updateInvoice] = useUpdateInvoiceMutation();
  const [updateStatus] = useUpdateInvoiceStatusMutation();

  const products = productsData?.products || [];

  const [lines, setLines] = useState(
    invoice?.items?.length
      ? invoice.items.map((item) => ({
          key: Math.random().toString(36).slice(2),
          productId: item.productId,
          quantity: item.quantity,
          tax: item.tax || 0,
        }))
      : [emptyLine()]
  );

  const productById = (id) => products.find((p) => p.id === id);

  const initialValues = {
    clientId: invoice?.clientId || "",
    issueDate: invoice?.issueDate || new Date().toISOString().slice(0, 10),
    dueDate: invoice?.dueDate || new Date().toISOString().slice(0, 10),
    description: invoice?.description || "",
    currency: invoice?.currency || "Rs",
  };

  const buildPayload = (values, status) => ({
    clientId: values.clientId,
    issueDate: values.issueDate,
    dueDate: values.dueDate,
    description: values.description,
    currency: values.currency,
    status,
    items: lines
      .filter((line) => line.productId)
      .map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity),
        tax: Number(line.tax) || 0,
      })),
  });

  const save = async (values, status) => {
    const payload = buildPayload(values, status);
    if (!payload.items.length) {
      toast.error("Kam az kam 1 product select karo");
      return;
    }
    try {
      if (invoice) {
        await updateInvoice({ id: invoice.id, ...payload }).unwrap();
        if (status !== "draft" && invoice.status === "draft") {
          await updateStatus({ id: invoice.id, status }).unwrap();
        }
        toast.success("Invoice updated");
      } else {
        await createInvoice(payload).unwrap();
        toast.success(status === "draft" ? "Draft saved" : "Invoice created");
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(getErrorMessage(err, "Save failed"));
    }
  };

  return (
    <Formik initialValues={initialValues} validationSchema={schema} enableReinitialize onSubmit={() => {}}>
      {({ values }) => (
        <Form>
          <div className="invoice-drawer" onClick={onClose}>
            <div className="invoice-drawer-panel" onClick={(e) => e.stopPropagation()}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="edit-text">
                  <span className="hash-clr">#</span>
                  {invoice?.number || "New"}
                </div>
                <button type="button" className="btn cancel py-2 px-3 d-md-none" onClick={onClose}>
                  Close
                </button>
              </div>

              <div className="bill-form mb-2">Client</div>
              <div className="mb-3">
                <Field as="select" name="clientId" className="form-select input-settings">
                  <option value="">Select client…</option>
                  {clients.map((c) => (
                    <option key={c.key || c._id || c.id} value={String(c.id)}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="clientId" component="div" className="text-danger" />
              </div>

              <div className="row g-2">
                <div className="col-md-6">
                  <label className="input-clr mb-1">Invoice date</label>
                  <Field type="date" name="issueDate" className="form-control input-settings" />
                </div>
                <div className="col-md-6">
                  <label className="input-clr mb-1">Due date</label>
                  <Field type="date" name="dueDate" className="form-control input-settings" />
                </div>
              </div>

              <div className="mt-2">
                <label className="input-clr mb-1">Description</label>
                <Field name="description" className="form-control input-settings" />
              </div>

              <div className="mt-2">
                <label className="input-clr mb-1">Currency</label>
                <Field as="select" name="currency" className="form-select input-settings">
                  <option value="Rs">Rs</option>
                  <option value="$">$</option>
                </Field>
              </div>

              <div className="item-list mt-4 mb-2">Items (from stock)</div>
              {lines.map((line, index) => {
                const product = productById(line.productId);
                const lineTotal = calcLineTotal(line.quantity, product?.price, line.tax);
                return (
                  <div className="row g-2 align-items-end mb-3" key={line.key}>
                    <div className="col-12 col-md-5">
                      <label className="d-md-none input-clr mb-1">Product</label>
                      <select
                        className="form-select input-settings"
                        value={line.productId}
                        onChange={(e) => {
                          const next = [...lines];
                          next[index] = { ...line, productId: e.target.value };
                          setLines(next);
                        }}
                      >
                        <option value="">Select product…</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — stock {p.stock} — Rs {p.price}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-4 col-md-2">
                      <label className="d-md-none input-clr mb-1">Qty</label>
                      <input
                        type="number"
                        min={1}
                        className="form-control input-settings"
                        value={line.quantity}
                        onChange={(e) => {
                          const next = [...lines];
                          next[index] = { ...line, quantity: e.target.value };
                          setLines(next);
                        }}
                      />
                    </div>
                    <div className="col-4 col-md-2">
                      <label className="d-md-none input-clr mb-1">Tax %</label>
                      <input
                        type="number"
                        className="form-control input-settings"
                        value={line.tax}
                        onChange={(e) => {
                          const next = [...lines];
                          next[index] = { ...line, tax: e.target.value };
                          setLines(next);
                        }}
                      />
                    </div>
                    <div className="col-3 col-md-2 text-center py-2">{(lineTotal || 0).toFixed(0)}</div>
                    <div className="col-1 trash">
                      <span
                        className="cursor basket"
                        onClick={() => setLines(lines.filter((_, i) => i !== index))}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </span>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                className="btn input-clr1 add-btn py-2 w-100"
                onClick={() => setLines([...lines, emptyLine()])}
              >
                + Add product line
              </button>

              <div className="invoice-form-actions mt-4">
                <button type="button" className="btn cancel py-2 px-3" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn save py-2 px-3"
                  onClick={() => save(values, "draft")}
                >
                  Save draft
                </button>
                <button
                  type="button"
                  className="btn save-changes py-2 px-3"
                  onClick={() => save(values, "pending")}
                >
                  Create (deduct stock)
                </button>
              </div>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
