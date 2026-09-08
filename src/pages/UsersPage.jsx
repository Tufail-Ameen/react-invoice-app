import { ErrorMessage, Field, Form, Formik } from "formik";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import * as Yup from "yup";
import UserList from "../components/users/UserList";
import Input from "../components/ui/Input";

const initialValues = {
  firstName: "",
  lastName: "",
  phoneno: "",
  cnic: "",
  email: "",
  gender: "Male",
  address: "",
  sallary: "",
  pasword: "",
  cPasword: "",
};

const validationSchema = Yup.object({
  firstName: Yup.string()
    .matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/, "Only alphabetic characters are allowed")
    .min(3, "First Name must be at least 3 characters")
    .max(50, "First Name must be at most 50 characters")
    .required("First Name is required"),
  lastName: Yup.string()
    .matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/, "Only alphabetic characters are allowed")
    .min(3, "Last Name must be at least 3 characters")
    .max(50, "Last Name must be at most 50 characters")
    .required("Last Name is required"),
  email: Yup.string().required("Email is required").email("Invalid email address"),
  phoneno: Yup.string()
    .required("Phone No is required")
    .test(
      "phone-number",
      "Phone number must be 11 digits and contain only numeric digits",
      (value) => /^\d{11}$/.test(value || "")
    ),
  address: Yup.string().required("Address is Required"),
  pasword: Yup.string().required("Password is required"),
  sallary: Yup.string().required("Salary is required"),
  cPasword: Yup.string()
    .required("Password is required")
    .oneOf([Yup.ref("pasword"), null], "Passwords must match"),
  cnic: Yup.string()
    .required("CNIC is required")
    .matches(
      /^[0-9+]{5}-[0-9+]{7}-[0-9]{1}$/,
      "Invalid CNIC format. Please enter a valid CNIC (e.g., 12345-6789012-3)"
    ),
});

export default function UsersPage() {
  const [formData, setFormData] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [buttonUpdate, setButtonUpdate] = useState("");

  const onSubmit = (values, { resetForm }) => {
    if (editingIndex !== -1) {
      const data = [...formData];
      data[editingIndex] = values;
      setFormData(data);
      setEditingIndex(-1);
      toast.success("Updated Successfully");
      setButtonUpdate("");
    } else {
      setFormData([...formData, values]);
      toast.success("Added Successfully");
    }
    resetForm();
  };

  const handeldeletebtn = (index) => {
    Swal.fire({
      title: "Do you want to delete?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes!",
      cancelButtonText: "No!",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        const originalArray = [...formData];
        originalArray.splice(index, 1);
        setFormData(originalArray);
        toast.success("Deleted Successfully");
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        toast.error("Cancel Successfully");
      }
    });
  };

  const handeleditbtn = (index) => {
    setEditingIndex(index);
    setButtonUpdate("Update");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="page-wrap">
      <Formik
        initialValues={editingIndex !== -1 ? formData[editingIndex] : initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {({ values, handleChange }) => (
          <Form className="form-card">
            <h1 className="page-title">Register to Create Invoice</h1>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="first-name" className="form-label input-clr">
                  First Name:
                </label>
                <Field
                  as={Input}
                  type="text"
                  id="first-name"
                  name="firstName"
                />
                <ErrorMessage name="firstName" component="div" className="font-bold text-danger" />
              </div>
              <div>
                <label htmlFor="last-name" className="form-label input-clr">
                  Last Name:
                </label>
                <Field
                  as={Input}
                  type="text"
                  id="last-name"
                  name="lastName"
                />
                <ErrorMessage name="lastName" component="div" className="font-bold text-danger" />
              </div>
              <div>
                <label htmlFor="phone-no" className="form-label input-clr">
                  Phone No:
                </label>
                <Field
                  as={Input}
                  type="text"
                  id="phone-no"
                  name="phoneno"
                />
                <ErrorMessage name="phoneno" component="div" className="font-bold text-danger" />
              </div>
              <div>
                <label htmlFor="cnic" className="form-label input-clr">
                  CNIC:
                </label>
                <Field as={Input} type="text" id="cnic" name="cnic" />
                <ErrorMessage name="cnic" component="div" className="font-bold text-danger" />
              </div>
              <div>
                <label htmlFor="email" className="form-label input-clr">
                  Email:
                </label>
                <Field
                  as={Input}
                  type="email"
                  id="email"
                  name="email"
                />
                <ErrorMessage name="email" component="div" className="font-bold text-danger" />
              </div>
              <div>
                <label className="input-clr mb-2 block">Gender:</label>
                <div className="flex gap-4">
                  <div className="form-check">
                    <Input
                      type="radio"
                      name="gender"
                      id="gender-male"
                      value="Male"
                      checked={values.gender === "Male"}
                      onChange={handleChange}
                    />
                    <label className="form-check-label setfont" htmlFor="gender-male">
                      Male
                    </label>
                  </div>
                  <div className="form-check">
                    <Input
                      type="radio"
                      name="gender"
                      id="gender-female"
                      value="Female"
                      checked={values.gender === "Female"}
                      onChange={handleChange}
                    />
                    <label className="form-check-label setfont" htmlFor="gender-female">
                      Female
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="address" className="form-label input-clr">
                  Address:
                </label>
                <Field
                  as={Input}
                  type="text"
                  id="address"
                  name="address"
                />
                <ErrorMessage name="address" component="div" className="font-bold text-danger" />
              </div>
              <div>
                <label htmlFor="salary" className="form-label input-clr">
                  Salary:
                </label>
                <Field
                  as={Input}
                  type="number"
                  id="salary"
                  name="sallary"
                />
                <ErrorMessage name="sallary" component="div" className="font-bold text-danger" />
              </div>
              <div>
                <label htmlFor="pasword" className="form-label input-clr">
                  Password:
                </label>
                <Field
                  as={Input}
                  type="password"
                  id="pasword"
                  name="pasword"
                />
                <ErrorMessage name="pasword" component="div" className="font-bold text-danger" />
              </div>
              <div>
                <label htmlFor="c-pasword" className="form-label input-clr">
                  Confirm Password:
                </label>
                <Field
                  as={Input}
                  type="password"
                  id="c-pasword"
                  name="cPasword"
                />
                <ErrorMessage name="cPasword" component="div" className="font-bold text-danger" />
              </div>
              <div>
                <button type="submit" className="btn input-clr1 save-changes w-full min-h-12 py-2 md:w-auto">
                  {buttonUpdate || "Register"}
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>

      <div className="mt-4">
        <UserList users={formData} onEdit={handeleditbtn} onDelete={handeldeletebtn} />
      </div>

      <ToastContainer
        position="top-center"
        autoClose={500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}
