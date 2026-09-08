import { ErrorMessage, Field, Form, Formik } from "formik";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import * as Yup from "yup";
import AuthShell from "../components/auth/AuthShell";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import { useForgotPasswordMutation } from "../services/invoiceApi";

const schema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email required"),
});

export default function ForgotPasswordPage() {
  const [forgotPassword] = useForgotPasswordMutation();
  const [sent, setSent] = useState(null);

  if (sent) {
    return (
      <AuthShell
        recover
        eyebrow="Check your inbox"
        title="Reset link sent"
        description="If that email is registered, you’ll receive instructions shortly. The link expires in 30 minutes."
        backTo="/login"
        backLabel="Back to sign in"
        footer={
          <p>
            Remembered your password? <Link to="/login">Sign in</Link>
          </p>
        }
      >
        <div className="auth-form">
          <div className="auth-status auth-status-success">
            <strong>Instructions are on the way</strong>
            <span>
              We sent a reset link to <em>{sent.email}</em>. Check spam if you don’t see it.
            </span>
          </div>

          {sent.devToken && (
            <div className="auth-status auth-status-dev">
              <strong>Dev only</strong>
              <span>
                The mock backend cannot send email, so the reset token is shown here.
                Real backends should email this link instead.
              </span>
              <Link to={`/reset-password?token=${sent.devToken}`}>
                /reset-password?token={sent.devToken}
              </Link>
            </div>
          )}

          <Link to="/login" className="auth-submit">
            Return to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      recover
      eyebrow="Account recovery"
      title="Forgot your password?"
      description="Enter the email on your account and we’ll send a reset link."
      backTo="/login"
      backLabel="Back to sign in"
      footer={
        <p>
          Remembered your password? <Link to="/login">Sign in instead</Link>
        </p>
      }
    >
      <Formik
        initialValues={{ email: "" }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const result = await forgotPassword({ email: values.email }).unwrap();
            setSent({ email: values.email, devToken: result?.devToken });
          } catch (err) {
            toast.error(getErrorMessage(err, "Could not send reset link"));
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <Field
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
              />
              <ErrorMessage name="email" component="div" className="auth-field-error" />
            </div>
            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending reset link…" : "Send reset link"}
            </button>
            <p className="auth-admin-note">
              For security, we won’t confirm whether this email has an account.
            </p>
          </Form>
        )}
      </Formik>
    </AuthShell>
  );
}
