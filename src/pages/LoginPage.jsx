import { ErrorMessage, Field, Form, Formik } from "formik";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import * as Yup from "yup";
import { useAuth } from "../auth/AuthContext";
import { isPlatformAdminUser } from "../lib/permissions";
import { getErrorMessage } from "../lib/rtkBaseQuery";

const schema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email required"),
  password: Yup.string().required("Password required"),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const from = location.state?.from?.pathname;

  return (
    <div className="page-wrap d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="form-card auth-card" style={{ maxWidth: 440, width: "100%" }}>
        <p className="auth-eyebrow">Invoice App</p>
        <h1 className="page-title mb-1">Sign in</h1>
        <p className="textcklr mb-3">
          Apne account ke email aur password se sign in karein. Aapka access
          backend par assigned role ke mutabiq hoga.
        </p>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={schema}
          onSubmit={async (values) => {
            setSubmitting(true);
            try {
              const user = await login(values.email, values.password);
              toast.success("Logged in");
              const isPlatformAdmin = isPlatformAdminUser(user);
              const requestedPath = from && from !== "/login" ? from : null;
              const canReturnToRequestedPath =
                requestedPath &&
                (isPlatformAdmin || !requestedPath.startsWith("/platform"));
              const fallback = isPlatformAdmin ? "/platform/businesses" : "/";
              navigate(canReturnToRequestedPath ? requestedPath : fallback, {
                replace: true,
              });
            } catch (err) {
              toast.error(getErrorMessage(err, "Login failed"));
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

            <div className="auth-footer mt-3">
              <p className="textcklr small mb-0">
                Nayi dukaan start karni hai?{" "}
                <Link to="/register">Business register</Link>
              </p>
              <p className="textcklr small mb-0 mt-1">
                Platform Owner public register nahi karta — account backend seed se banta hai.
              </p>
            </div>
          </Form>
        </Formik>
      </div>
      <ToastContainer position="top-center" autoClose={1500} />
    </div>
  );
}
