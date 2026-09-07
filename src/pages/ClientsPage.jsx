import { ErrorMessage, Field, Form, Formik } from "formik";
import { useState } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { useAuth } from "../auth/AuthContext";
import ClientList from "../components/clients/ClientList";
import CountryDatalist from "../components/ui/CountryDatalist";
import { useClientMutations } from "../hooks/useClients";
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
      {canShowForm && (
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
                  <Field
                    name="country"
                    id="country"
                    list="client-countries"
                    className="form-control input-settings"
                  />
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
      )}

      <h2 className="page-title mb-3">Clients</h2>
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
