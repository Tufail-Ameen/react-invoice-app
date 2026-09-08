import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useState } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { getErrorMessage } from "../../lib/rtkBaseQuery";
import { useClients } from "../../hooks/useClients";
import {
  useConfirmInvoiceMutation,
  useCreateInvoiceMutation,
  useGetProductsQuery,
  useUpdateInvoiceMutation,
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
  return {
    key: Math.random().toString(36).slice(2),
    productId: "",
    quantity: 1,
    unitPrice: 0,
    tax: 0,
  };
}

function productSalePrice(product) {
  if (!product) return 0;
  return Number(product.salePrice ?? product.price ?? 0) || 0;
}

export default function InvoiceForm({ invoice, onClose, onSaved }) {
  const { clients } = useClients();
  const { data: productsData } = useGetProductsQuery({ per_page: 100, status: "active" });
  const [createInvoice] = useCreateInvoiceMutation();
  const [updateInvoice] = useUpdateInvoiceMutation();
  const [confirmInvoice] = useConfirmInvoiceMutation();

  const products = productsData?.products || [];

  const [lines, setLines] = useState(
    invoice?.items?.length
      ? invoice.items.map((item) => ({
          key: Math.random().toString(36).slice(2),
          productId: item.productId != null ? String(item.productId) : "",
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? 0,
          tax: item.tax || 0,
        }))
      : [emptyLine()]
  );

  const productById = (id) => products.find((p) => String(p.id) === String(id));

  const initialValues = {
    clientId: invoice?.clientId != null ? String(invoice.clientId) : "",
    issueDate: invoice?.issueDate || new Date().toISOString().slice(0, 10),
    dueDate: invoice?.dueDate || new Date().toISOString().slice(0, 10),
    description: invoice?.description || invoice?.notes || "",
    currency: invoice?.currency || "Rs",
  };

  const buildPayload = (values) => ({
    clientId: Number(values.clientId),
    issueDate: values.issueDate,
    dueDate: values.dueDate,
    description: values.description,
    notes: values.description,
    currency: values.currency,
    items: lines
      .filter((line) => line.productId)
      .map((line) => {
        const product = productById(line.productId);
        return {
          productId: Number(line.productId),
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice) || productSalePrice(product),
          tax: Number(line.tax) || 0,
        };
      }),
  });

  const save = async (values, { confirmAfter = false } = {}) => {
    const payload = buildPayload(values);
    if (!payload.items.length) {
      toast.error("Kam az kam 1 product select karo");
      return;
    }
    try {
      let invoiceId = invoice?.id;
      if (invoice) {
        await updateInvoice({ id: invoice.id, ...payload }).unwrap();
        toast.success("Draft updated");
      } else {
        const result = await createInvoice(payload).unwrap();
        invoiceId = result?.invoice?.id ?? result?.id;
        toast.success("Draft saved");
      }

      if (confirmAfter && invoiceId != null) {
        try {
          await confirmInvoice(invoiceId).unwrap();
          toast.success("Invoice confirmed — stock deducted");
        } catch (confirmErr) {
          toast.error(getErrorMessage(confirmErr, "Draft saved but confirm failed"));
          onSaved?.();
          onClose?.();
          return;
        }
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
                  {invoice?.number || invoice?.invoiceNumber || "New"}
                </div>
                <button type="button" className="btn cancel py-2 px-3 d-md-none" onClick={onClose}>
                  Close
                </button>
              </div>

              <p className="textcklr small mb-3">
                Save draft keeps stock unchanged. Save &amp; confirm deducts stock after create.
              </p>

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
                const unitPrice = Number(line.unitPrice) || productSalePrice(product);
                const lineTotal = calcLineTotal(line.quantity, unitPrice, 0) + (Number(line.tax) || 0);
                return (
                  <div className="row g-2 align-items-end mb-3" key={line.key}>
                    <div className="col-12 col-md-4">
                      <label className="d-md-none input-clr mb-1">Product</label>
                      <select
                        className="form-select input-settings"
                        value={line.productId}
                        onChange={(e) => {
                          const productId = e.target.value;
                          const nextProduct = productById(productId);
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            productId,
                            unitPrice: productSalePrice(nextProduct),
                          };
                          setLines(next);
                        }}
                      >
                        <option value="">Select product…</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — stock {p.stock} — Rs {productSalePrice(p)}
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
                      <label className="d-md-none input-clr mb-1">Price</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="form-control input-settings"
                        value={line.unitPrice}
                        onChange={(e) => {
                          const next = [...lines];
                          next[index] = { ...line, unitPrice: e.target.value };
                          setLines(next);
                        }}
                      />
                    </div>
                    <div className="col-4 col-md-2">
                      <label className="d-md-none input-clr mb-1">Tax</label>
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
                    <div className="col-3 col-md-1 text-center py-2">{(lineTotal || 0).toFixed(0)}</div>
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
                  onClick={() => save(values, { confirmAfter: false })}
                >
                  Save draft
                </button>
                <button
                  type="button"
                  className="btn save-changes py-2 px-3"
                  onClick={() => save(values, { confirmAfter: true })}
                >
                  Save &amp; confirm
                </button>
              </div>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
