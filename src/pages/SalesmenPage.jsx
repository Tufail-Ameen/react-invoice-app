import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { Can } from "../auth/guards";
import EmptyState from "../components/ui/EmptyState";
import FilterMenu from "../components/ui/FilterMenu";
import StatusBadge from "../components/ui/StatusBadge";
import { PERMISSIONS } from "../lib/permissions";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import {
  useArchiveSalesmanMutation,
  useCreateSalesmanMutation,
  useGetSalesmenQuery,
  useGetUsersQuery,
  useUpdateSalesmanMutation,
} from "../services/invoiceApi";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "ACTIVE", value: "ACTIVE" },
  { label: "INACTIVE", value: "INACTIVE" },
];

const createSchema = Yup.object({
  userId: Yup.string().required("User required"),
  displayName: Yup.string().max(120),
  employeeCode: Yup.string().max(50),
  phone: Yup.string().max(40),
  email: Yup.string().email("Invalid email").max(120),
  notes: Yup.string().max(500),
});

export default function SalesmenPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);

  const params = { limit: 100 };
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading, isError, error } = useGetSalesmenQuery(params);
  const { data: usersData } = useGetUsersQuery({}, { skip: !showCreate });
  const [createSalesman] = useCreateSalesmanMutation();
  const [updateSalesman] = useUpdateSalesmanMutation();
  const [archiveSalesman] = useArchiveSalesmanMutation();

  const salesmen = data?.salesmen || [];
  const users = usersData?.users || usersData?.items || [];
  const linkedUserIds = new Set(salesmen.map((s) => String(s.userId)));
  const availableUsers = users.filter((u) => !linkedUserIds.has(String(u.id)));

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Failed to load salesmen"));
  }, [isError, error]);

  const onCreate = async (values, { resetForm }) => {
    try {
      await createSalesman({
        userId: values.userId,
        displayName: values.displayName || undefined,
        employeeCode: values.employeeCode || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        notes: values.notes || undefined,
      }).unwrap();
      toast.success("Salesman created");
      resetForm();
      setShowCreate(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Create failed"));
    }
  };

  const onSaveEdit = async (values) => {
    try {
      await updateSalesman({
        id: editing.id,
        displayName: values.displayName,
        employeeCode: values.employeeCode || null,
        phone: values.phone || null,
        email: values.email || null,
        notes: values.notes || null,
        status: values.status,
      }).unwrap();
      toast.success("Salesman updated");
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Update failed"));
    }
  };

  const onToggleStatus = async (salesman) => {
    const next =
      String(salesman.status).toUpperCase() === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateSalesman({ id: salesman.id, status: next }).unwrap();
      toast.success(next === "ACTIVE" ? "Activated" : "Deactivated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Status update failed"));
    }
  };

  const onArchive = async (salesman) => {
    if (!window.confirm(`Archive ${salesman.displayName}?`)) return;
    try {
      await archiveSalesman(salesman.id).unwrap();
      toast.success("Salesman archived");
    } catch (err) {
      toast.error(getErrorMessage(err, "Archive failed"));
    }
  };

  return (
    <div className="page-wrap">
      <div className="invoices-header">
        <div>
          <h1 className="invoice-text mb-1">Salesmen</h1>
          <p className="count-invoices-tect mb-0">
            There are {salesmen.length} salesman profiles
          </p>
        </div>

        <div className="invoices-header-actions">
          <FilterMenu
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <Can permission={PERMISSIONS.SALESMEN_CREATE}>
            <button
              type="button"
              className="btn new-invoice"
              onClick={() => setShowCreate(true)}
            >
              <span className="circle-plus me-2">
                <FontAwesomeIcon icon={faCirclePlus} />
              </span>
              New Salesman
            </button>
          </Can>
        </div>
      </div>

      {showCreate && (
        <Formik
          initialValues={{
            userId: "",
            displayName: "",
            employeeCode: "",
            phone: "",
            email: "",
            notes: "",
          }}
          validationSchema={createSchema}
          onSubmit={onCreate}
        >
          <Form className="form-card mb-4">
            <h2 className="page-title">Create Salesman</h2>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="userId">
                  Team User
                </label>
                <Field as="select" name="userId" id="userId" className="form-select input-settings">
                  <option value="">Select user…</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={String(u.id)}>
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}
                      {u.email ? ` (${u.email})` : ""}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="userId" component="div" className="text-red-600" />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="displayName">
                  Display Name
                </label>
                <Field name="displayName" id="displayName" className="form-control input-settings" />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="employeeCode">
                  Employee Code
                </label>
                <Field name="employeeCode" id="employeeCode" className="form-control input-settings" />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="phone">
                  Phone
                </label>
                <Field name="phone" id="phone" className="form-control input-settings" />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="email">
                  Email
                </label>
                <Field name="email" id="email" className="form-control input-settings" />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="notes">
                  Notes
                </label>
                <Field name="notes" id="notes" className="form-control input-settings" />
              </div>
              <div className="col-span-12 flex gap-2">
                <button type="submit" className="btn input-clr1 save-changes px-4 py-2">
                  Create
                </button>
                <button
                  type="button"
                  className="btn cancel px-3 py-2"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </Form>
        </Formik>
      )}

      {editing && (
        <Formik
          initialValues={{
            displayName: editing.displayName || "",
            employeeCode: editing.employeeCode || "",
            phone: editing.phone || "",
            email: editing.email || "",
            notes: editing.notes || "",
            status: editing.status || "ACTIVE",
          }}
          enableReinitialize
          onSubmit={onSaveEdit}
        >
          <Form className="form-card mb-4">
            <h2 className="page-title">Edit {editing.displayName}</h2>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="editDisplayName">
                  Display Name
                </label>
                <Field
                  name="displayName"
                  id="editDisplayName"
                  className="form-control input-settings"
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="editCode">
                  Employee Code
                </label>
                <Field name="employeeCode" id="editCode" className="form-control input-settings" />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="editStatus">
                  Status
                </label>
                <Field as="select" name="status" id="editStatus" className="form-select input-settings">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Field>
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="editPhone">
                  Phone
                </label>
                <Field name="phone" id="editPhone" className="form-control input-settings" />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="editEmail">
                  Email
                </label>
                <Field name="email" id="editEmail" className="form-control input-settings" />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="form-label input-clr" htmlFor="editNotes">
                  Notes
                </label>
                <Field name="notes" id="editNotes" className="form-control input-settings" />
              </div>
              <div className="col-span-12 flex gap-2">
                <button type="submit" className="btn input-clr1 save-changes px-4 py-2">
                  Save
                </button>
                <button
                  type="button"
                  className="btn cancel px-3 py-2"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </Form>
        </Formik>
      )}

      {isLoading ? (
        <p className="textcklr mt-4">Loading…</p>
      ) : !salesmen.length ? (
        <EmptyState
          title="No salesmen yet"
          message="Link a team user to a salesman profile for field orders and visits."
        />
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {salesmen.map((salesman) => (
            <div
              key={salesman.id}
              className="invoice-row datalist m-0 grid grid-cols-12 items-center px-2 py-3"
            >
              <div
                className="col-span-12 cursor md:col-span-4"
                onClick={() => navigate(`/salesmen/${salesman.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/salesmen/${salesman.id}`);
                }}
              >
                <div className="table-text-size">{salesman.displayName}</div>
                <div className="textcklr text-sm">
                  {salesman.employeeCode || salesman.email || "—"}
                </div>
              </div>
              <div className="textcklr col-span-6 text-sm md:col-span-2">
                {salesman.phone || "—"}
              </div>
              <div className="col-span-6 md:col-span-2 md:justify-end flex">
                <StatusBadge status={salesman.status} compact />
              </div>
              <div className="col-span-12 mt-2 flex flex-wrap gap-2 md:col-span-4 md:mt-0 md:justify-end">
                <Can permission={PERMISSIONS.SALESMEN_UPDATE}>
                  <button
                    type="button"
                    className="btn edit py-1 px-2"
                    onClick={() => setEditing(salesman)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn pendingbtn py-1 px-2"
                    onClick={() => onToggleStatus(salesman)}
                  >
                    {String(salesman.status).toUpperCase() === "ACTIVE"
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                </Can>
                <Can permission={PERMISSIONS.SALESMEN_ARCHIVE}>
                  <button
                    type="button"
                    className="btn cancel py-1 px-2"
                    onClick={() => onArchive(salesman)}
                  >
                    Archive
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
