import { ErrorMessage, Field, Form, Formik } from "formik";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { useAuth } from "../auth/AuthContext";
import { getErrorMessage } from "../lib/rtkBaseQuery";

const schema = Yup.object({
  firstName: Yup.string().required("First name required"),
  lastName: Yup.string().required("Last name required"),
  email: Yup.string().email("Invalid email").required("Email required"),
  password: Yup.string().min(8, "Min 8 characters").required("Password required"),
  businessName: Yup.string().required("Business name required"),
});

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="page-wrap d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="form-card auth-card" style={{ maxWidth: 480, width: "100%" }}>
        <p className="auth-eyebrow">Business signup</p>
        <h1 className="page-title mb-1">Start your business</h1>
        <p className="textcklr mb-2">
          Yeh form <strong>sirf nayi business</strong> ke liye hai. Aap{" "}
          <strong>Business Owner</strong> banoge — apni dukaan + team manage karoge.
        </p>
        <div className="auth-callout mb-4">
          <strong>Platform Owner yahan se nahi banta.</strong>
          <span>
            Platform Super Owner backend seed se create hota hai aur{" "}
            <Link to="/login">Sign in</Link> se aata hai (Businesses manage karta hai).
          </span>
        </div>

        <Formik
          initialValues={{
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            businessName: "",
          }}
          validationSchema={schema}
          onSubmit={async (values) => {
            setSubmitting(true);
            try {
              await register(values);
              toast.success("Business Owner account ready");
              navigate("/", { replace: true });
            } catch (err) {
              toast.error(getErrorMessage(err, "Register failed"));
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label input-clr" htmlFor="firstName">
                  First name
                </label>
                <Field id="firstName" name="firstName" className="form-control input-settings" />
                <ErrorMessage name="firstName" component="div" className="text-danger" />
              </div>
              <div className="col-md-6">
                <label className="form-label input-clr" htmlFor="lastName">
                  Last name
                </label>
                <Field id="lastName" name="lastName" className="form-control input-settings" />
                <ErrorMessage name="lastName" component="div" className="text-danger" />
              </div>
              <div className="col-12">
                <label className="form-label input-clr" htmlFor="businessName">
                  Business name
                </label>
                <Field
                  id="businessName"
                  name="businessName"
                  className="form-control input-settings"
                  placeholder="e.g. Demo Traders"
                />
                <ErrorMessage name="businessName" component="div" className="text-danger" />
              </div>
              <div className="col-12">
                <label className="form-label input-clr" htmlFor="email">
                  Work email
                </label>
                <Field id="email" name="email" type="email" className="form-control input-settings" />
                <ErrorMessage name="email" component="div" className="text-danger" />
              </div>
              <div className="col-12">
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
            </div>

            <button
              type="submit"
              className="btn input-clr1 save-changes py-2 w-100 mt-4"
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create business account"}
            </button>

            <p className="textcklr small mt-3 mb-0">
              Already have an account? <Link to="/login">Sign in</Link>
              {" · "}
              Platform Owner? <Link to="/login">Sign in here</Link>
            </p>
          </Form>
        </Formik>
      </div>
    </div>
  );
}
