import { ErrorMessage, Field, Form, Formik } from "formik";
import { useState } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { useAuth } from "../auth/AuthContext";
import ClientList from "../components/clients/ClientList";
import CountryDatalist from "../components/ui/CountryDatalist";
import { useClientMutations, useClients } from "../hooks/useClients";
import { PERMISSIONS } from "../lib/permissions";
import { getErrorMessage } from "../lib/rtkBaseQuery";

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
  const [editing, setEditing] = useState(null);
  const { can } = useAuth();
  const { clients, isLoading } = useClients();
  const { createClient, updateClient, deleteClient } = useClientMutations();
  const canShowForm = editing
    ? can(PERMISSIONS.CLIENTS_UPDATE)
    : can(PERMISSIONS.CLIENTS_CREATE);

  const onSubmit = async (values, { resetForm }) => {
    try {
      if (editing) {
        await updateClient({ id: editing.id, ...values }).unwrap();
        toast.success("Client updated");
        setEditing(null);
      } else {
        await createClient(values).unwrap();
        toast.success("Client added");
      }
      resetForm();
    } catch (err) {
      toast.error(getErrorMessage(err, "Save failed"));
    }
  };

  const onDelete = async (client) => {
    if (!window.confirm(`Delete ${client.name}?`)) return;
    try {
      await deleteClient(client.id).unwrap();
      toast.success("Deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Delete failed"));
    }
  };

  return (
    <div className="page-wrap">
      <div className="invoices-header mb-2">
        <div>
          <h1 className="page-title mb-1">Clients</h1>
          <p className="count-invoices-tect mb-0">
            Add and manage billing clients
          </p>
        </div>
      </div>

      {canShowForm && (
        <Formik
          initialValues={editing || emptyForm}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({ resetForm }) => (
            <Form className="form-card form-card-compact mb-3">
              <div className="product-form">
                <div className="product-form-head">
                  <h2 className="bill-form mb-0">{editing ? "Edit client" : "Add client"}</h2>
                  <div className="product-form-head-actions">
                    <button type="submit" className="btn save-changes btn-compact">
                      {editing ? "Update" : "Add client"}
                    </button>
                    {editing && (
                      <button
                        type="button"
                        className="btn cancel btn-compact"
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
                <div className="product-form-grid client-form-grid">
                  <div className="pf-field">
                    <label className="form-label input-clr" htmlFor="name">Name</label>
                    <Field name="name" id="name" className="form-control input-settings input-compact" placeholder="Name" />
                    <ErrorMessage name="name" component="div" className="text-danger small mb-0" />
                  </div>
                  <div className="pf-field">
                    <label className="form-label input-clr" htmlFor="email">Email</label>
                    <Field name="email" id="email" type="email" className="form-control input-settings input-compact" placeholder="Email" />
                    <ErrorMessage name="email" component="div" className="text-danger small mb-0" />
                  </div>
                  <div className="pf-field">
                    <label className="form-label input-clr" htmlFor="address">Street address</label>
                    <Field name="address" id="address" className="form-control input-settings input-compact" placeholder="Street" />
                    <ErrorMessage name="address" component="div" className="text-danger small mb-0" />
                  </div>
                  <div className="pf-field">
                    <label className="form-label input-clr" htmlFor="city">City</label>
                    <Field name="city" id="city" className="form-control input-settings input-compact" placeholder="City" />
                    <ErrorMessage name="city" component="div" className="text-danger small mb-0" />
                  </div>
                  <div className="pf-field">
                    <label className="form-label input-clr" htmlFor="code">Post code</label>
                    <Field name="code" id="code" className="form-control input-settings input-compact" placeholder="12345" />
                    <ErrorMessage name="code" component="div" className="text-danger small mb-0" />
                  </div>
                  <div className="pf-field">
                    <label className="form-label input-clr" htmlFor="country">Country</label>
                    <Field
                      name="country"
                      id="country"
                      list="client-countries"
                      className="form-control input-settings input-compact"
                      placeholder="Country"
                    />
                    <CountryDatalist id="client-countries" />
                    <ErrorMessage name="country" component="div" className="text-danger small mb-0" />
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      )}

      <div className="d-flex align-items-center justify-content-between mb-2">
        <h2 className="product-list-heading">Clients</h2>
        {!isLoading && clients.length > 0 && (
          <span className="textcklr small">{clients.length}</span>
        )}
      </div>
      <ClientList
        onEdit={(client) => {
          if (can(PERMISSIONS.CLIENTS_UPDATE)) setEditing(client);
        }}
        onDelete={onDelete}
        canEditPermission={PERMISSIONS.CLIENTS_UPDATE}
        canDeletePermission={PERMISSIONS.CLIENTS_DELETE}
      />
    </div>
  );
}
