import { ErrorMessage, Field, Form, Formik } from "formik";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import * as Yup from "yup";
import AuthShell from "../components/auth/AuthShell";
import Input from "../components/ui/Input";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import { useResetPasswordMutation } from "../services/invoiceApi";

const schema = Yup.object({
  password: Yup.string().min(8, "Min 8 characters").required("Password required"),
  passwordConfirmation: Yup.string()
    .required("Confirm your password")
    .oneOf([Yup.ref("password")], "Passwords do not match"),
});

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [resetPassword] = useResetPasswordMutation();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <AuthShell
        recover
        eyebrow="Invalid link"
        title="This reset link isn’t valid"
        description="The link is missing a token. Request a new reset email and try again."
        backTo="/forgot-password"
        backLabel="Request a new link"
        footer={
          <p>
            Need another link? <Link to="/forgot-password">Forgot password</Link>
          </p>
        }
      >
        <div className="auth-form">
          <Link to="/forgot-password" className="auth-submit">
            Request a new reset link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      recover
      eyebrow="Choose a new password"
      title="Set a new password"
      description="After you save it, you’ll sign in with this password. Other sessions will be signed out."
      backTo="/login"
      backLabel="Back to sign in"
      footer={
        <p>
          Remembered your password? <Link to="/login">Sign in instead</Link>
        </p>
      }
    >
      <Formik
        initialValues={{ password: "", passwordConfirmation: "" }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await resetPassword({
              token,
              password: values.password,
              passwordConfirmation: values.passwordConfirmation,
            }).unwrap();
            toast.success("Password updated. Sign in with your new password.");
            navigate("/login", { replace: true });
          } catch (err) {
            toast.error(getErrorMessage(err, "Could not reset password"));
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="auth-form">
            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="password">New password</label>
                <span>At least 8 characters</span>
              </div>
              <Field
                as={Input}
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a strong password"
              />
              <ErrorMessage name="password" component="div" className="auth-field-error" />
            </div>
            <div className="auth-field">
              <label htmlFor="passwordConfirmation">Confirm password</label>
              <Field
                as={Input}
                id="passwordConfirmation"
                name="passwordConfirmation"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your new password"
              />
              <ErrorMessage
                name="passwordConfirmation"
                component="div"
                className="auth-field-error"
              />
            </div>
            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving new password…" : "Reset password"}
            </button>
          </Form>
        )}
      </Formik>
    </AuthShell>
  );
}
