import { ErrorMessage, Field, Form, Formik } from "formik";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { clientsApi } from "../api/endpoints";
import CountryDatalist from "../components/ui/CountryDatalist";
import EmptyState from "../components/ui/EmptyState";
import { ApiError } from "../lib/apiClient";

const emptyForm = {
  name: "",
  email: "",
  address: "",
  city: "",
  code: "",
  country: "",
};

const validationSchema = Yup.object({
  name: Yup.string()
    .matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/, "Only letters and spaces")
    .min(3)
    .max(50)
    .required("Name required"),
  email: Yup.string().email().required("Email required"),
  city: Yup.string().required("City required"),
  country: Yup.string().required("Country required"),
  code: Yup.string().matches(/^\d{5}$/, "5 digit postcode").required("Postcode required"),
  address: Yup.string().required("Address required"),
});

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clientsApi.list({ per_page: 100 });
      setClients(data.clients || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (values, { resetForm }) => {
    try {
      if (editing) {
        await clientsApi.update({ id: editing.id, ...values });
        toast.success("Client updated");
        setEditing(null);
      } else {
        await clientsApi.create(values);
        toast.success("Client added");
      }
      resetForm();
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    }
  };

  const onDelete = async (client) => {
    if (!window.confirm(`Delete ${client.name}?`)) return;
    try {
      await clientsApi.remove(client.id);
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  return (
    <div className="page-wrap">
      <Formik
        initialValues={editing || emptyForm}
        enableReinitialize
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ resetForm }) => (
          <Form className="form-card mb-4">
            <h1 className="page-title">{editing ? "Edit Client" : "Add Client"}</h1>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label input-clr" htmlFor="name">
                  Name
                </label>
                <Field name="name" id="name" className="form-control input-settings" />
                <ErrorMessage name="name" component="div" className="text-danger" />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label input-clr" htmlFor="email">
                  Email
                </label>
                <Field name="email" id="email" type="email" className="form-control input-settings" />
                <ErrorMessage name="email" component="div" className="text-danger" />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label input-clr" htmlFor="address">
                  Street Address
                </label>
                <Field name="address" id="address" className="form-control input-settings" />
                <ErrorMessage name="address" component="div" className="text-danger" />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label input-clr" htmlFor="city">
                  City
                </label>
                <Field name="city" id="city" className="form-control input-settings" />
                <ErrorMessage name="city" component="div" className="text-danger" />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label input-clr" htmlFor="code">
                  Post Code
                </label>
                <Field name="code" id="code" className="form-control input-settings" />
                <ErrorMessage name="code" component="div" className="text-danger" />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label input-clr" htmlFor="country">
                  Country
                </label>
                <Field name="country" id="country" list="client-countries" className="form-control input-settings" />
                <CountryDatalist id="client-countries" />
                <ErrorMessage name="country" component="div" className="text-danger" />
              </div>
              <div className="col-12 d-flex gap-2">
                <button type="submit" className="btn input-clr1 save-changes py-2 px-4">
                  {editing ? "Update" : "Add Client"}
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
                    Cancel edit
                  </button>
                )}
              </div>
            </div>
          </Form>
        )}
      </Formik>

      <h2 className="page-title mb-3">Clients</h2>
      {loading ? (
        <p className="textcklr">Loading…</p>
      ) : !clients.length ? (
        <EmptyState title="No clients yet" message="Add a client to bill invoices." />
      ) : (
        <div className="d-flex flex-column gap-2">
          {clients.map((client) => (
            <div key={client.id} className="row align-items-center invoice-row datalist py-3 px-2 m-0">
              <div className="col-12 col-md-4 table-text-size">{client.name}</div>
              <div className="col-12 col-md-3 textcklr small">{client.email}</div>
              <div className="col-12 col-md-3 textcklr small">
                {client.city}, {client.country}
              </div>
              <div className="col-12 col-md-2 d-flex gap-2 justify-content-md-end mt-2 mt-md-0">
                <button
                  type="button"
                  className="btn edit py-1 px-3"
                  onClick={() => setEditing(client)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn cancel py-1 px-3"
                  onClick={() => onDelete(client)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
