import { ErrorMessage, Field, Form, Formik } from "formik";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import * as Yup from "yup";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../lib/apiClient";

const schema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email required"),
  password: Yup.string().required("Password required"),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const from = location.state?.from?.pathname || "/";

  return (
    <div className="page-wrap d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="form-card" style={{ maxWidth: 420, width: "100%" }}>
        <h1 className="page-title mb-1">Invoice App</h1>
        <p className="textcklr mb-4">Login to manage invoices, products &amp; stock.</p>

        <Formik
          initialValues={{ email: "owner@invoice.test", password: "Password123!" }}
          validationSchema={schema}
          onSubmit={async (values) => {
            setSubmitting(true);
            try {
              await login(values.email, values.password);
              toast.success("Logged in");
              navigate(from, { replace: true });
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : "Login failed");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form>
            <div className="mb-3">
              <label className="form-label input-clr" htmlFor="email">
                Email
              </label>
              <Field id="email" name="email" type="email" className="form-control input-settings" />
              <ErrorMessage name="email" component="div" className="text-danger" />
            </div>
            <div className="mb-3">
              <label className="form-label input-clr" htmlFor="password">
                Password
              </label>
              <Field
                id="password"
                name="password"
                type="password"
                className="form-control input-settings"
              />
              <ErrorMessage name="password" component="div" className="text-danger" />
            </div>
            <button
              type="submit"
              className="btn input-clr1 save-changes py-2 w-100"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
            <p className="textcklr small mt-3 mb-0">
              Demo: owner@invoice.test / Password123!
            </p>
          </Form>
        </Formik>
      </div>
      <ToastContainer position="top-center" autoClose={1500} />
    </div>
  );
}
