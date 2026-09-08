import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { Can } from "../auth/guards";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { useClients } from "../hooks/useClients";
import { PERMISSIONS } from "../lib/permissions";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import {
  useCreateVisitMutation,
  useDeleteVisitMutation,
  useGetSalesmenQuery,
  useGetVisitsQuery,
} from "../services/invoiceApi";

const visitSchema = Yup.object({
  customerId: Yup.string().required("Customer required"),
  salesmanId: Yup.string().required("Salesman required"),
  visitDate: Yup.string().required("Date required"),
  purpose: Yup.string().max(200),
  notes: Yup.string().max(500),
});

export default function VisitsPage() {
  const location = useLocation();
  const [showForm, setShowForm] = useState(location.pathname === "/visits/new");
  const { clients } = useClients();
  const { data: salesmenData } = useGetSalesmenQuery({ status: "ACTIVE", limit: 100 });
  const { data, isLoading, isError, error } = useGetVisitsQuery({ limit: 100 });
  const [createVisit] = useCreateVisitMutation();
  const [deleteVisit] = useDeleteVisitMutation();

  const visits = data?.visits || [];
  const salesmen = salesmenData?.salesmen || [];

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Failed to load visits"));
  }, [isError, error]);

  const onCreate = async (values, { resetForm }) => {
    try {
      await createVisit({
        customerId: Number(values.customerId),
        clientId: Number(values.customerId),
        salesmanId: Number(values.salesmanId),
        visitDate: values.visitDate,
        purpose: values.purpose || undefined,
        notes: values.notes || undefined,
      }).unwrap();
      toast.success("Visit recorded");
      resetForm();
      setShowForm(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Create failed"));
    }
  };

  const onDelete = async (visit) => {
    if (!window.confirm("Delete this visit?")) return;
    try {
      await deleteVisit(visit.id).unwrap();
      toast.success("Visit deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Delete failed"));
    }
  };

  return (
    <div className="page-wrap">
      <div className="invoices-header">
        <div>
          <h1 className="invoice-text mb-1">Visits</h1>
          <p className="count-invoices-tect mb-0">
            There are {visits.length} customer visits
          </p>
        </div>

        <div className="invoices-header-actions">
          <Can permission={PERMISSIONS.VISITS_CREATE}>
            <button
              type="button"
              className="btn new-invoice"
              onClick={() => setShowForm((v) => !v)}
            >
              <span className="circle-plus me-2">
                <FontAwesomeIcon icon={faCirclePlus} />
              </span>
              {showForm ? "Hide form" : "New Visit"}
            </button>
          </Can>
        </div>
      </div>

      {showForm && (
        <Formik
          initialValues={{
            customerId: "",
            salesmanId: "",
            visitDate: new Date().toISOString().slice(0, 10),
            purpose: "",
            notes: "",
          }}
          validationSchema={visitSchema}
          onSubmit={onCreate}
        >
          <Form className="form-card mb-4">
            <h2 className="page-title">Record Visit</h2>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="customerId">
                  Customer
                </label>
                <Field
                  as="select"
                  name="customerId"
                  id="customerId"
                  className="form-select input-settings"
                >
                  <option value="">Select customer…</option>
                  {clients.map((c) => (
                    <option key={c.key || c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="customerId" component="div" className="text-red-600" />
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
                >
                  <option value="">Select salesman…</option>
                  {salesmen.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.displayName}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="salesmanId" component="div" className="text-red-600" />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="visitDate">
                  Visit Date
                </label>
                <Field
                  type="date"
                  name="visitDate"
                  id="visitDate"
                  className="form-control input-settings"
                />
                <ErrorMessage name="visitDate" component="div" className="text-red-600" />
              </div>
              <div className="col-span-12 md:col-span-6">
                <label className="form-label input-clr" htmlFor="purpose">
                  Purpose
                </label>
                <Field name="purpose" id="purpose" className="form-control input-settings" />
              </div>
              <div className="col-span-12 md:col-span-6">
                <label className="form-label input-clr" htmlFor="notes">
                  Notes
                </label>
                <Field name="notes" id="notes" className="form-control input-settings" />
              </div>
              <div className="col-span-12">
                <button type="submit" className="btn input-clr1 save-changes px-4 py-2">
                  Save Visit
                </button>
              </div>
            </div>
          </Form>
        </Formik>
      )}

      {isLoading ? (
        <p className="textcklr mt-4">Loading…</p>
      ) : !visits.length ? (
        <EmptyState
          title="No visits yet"
          message="Record a customer visit linked to a salesman."
        />
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="invoice-row datalist m-0 grid grid-cols-12 items-center px-2 py-3"
            >
              <div className="table-text-size col-span-12 md:col-span-1">#{visit.id}</div>
              <div className="textcklr col-span-12 text-sm md:col-span-3">
                {visit.customerName || `#${visit.customerId}`}
              </div>
              <div className="textcklr col-span-6 text-sm md:col-span-2">
                {visit.salesmanName || `#${visit.salesmanId}`}
              </div>
              <div className="textcklr col-span-6 text-sm md:col-span-2">
                {visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : "—"}
              </div>
              <div className="textcklr col-span-6 text-sm md:col-span-2">
                {visit.purpose || "—"}
              </div>
              <div className="col-span-6 flex flex-wrap items-center gap-2 md:col-span-2 md:justify-end">
                <StatusBadge status={visit.status} compact />
                {visit.orderId != null && (
                  <Link to={`/orders/${visit.orderId}`} className="textcklr text-sm">
                    Order #{visit.orderId}
                  </Link>
                )}
                <Can permission={PERMISSIONS.VISITS_DELETE}>
                  <button
                    type="button"
                    className="btn cancel py-1 px-2"
                    onClick={() => onDelete(visit)}
                  >
                    Delete
                  </button>
                </Can>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
