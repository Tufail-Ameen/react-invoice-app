import { ErrorMessage, Field, Form, Formik } from "formik";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRecoilState } from "recoil";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import * as Yup from "yup";
import ClientList from "../components/clients/ClientList";
import CountryDatalist from "../components/ui/CountryDatalist";
import { useCreateClientMutation } from "../services/clientApi";
import { printclientdata } from "../state/Atom";

const initialValues = {
  name: "",
  email: "",
  address: "",
  city: "",
  code: "",
  country: "",
};

const validationSchema = Yup.object({
  name: Yup.string()
    .matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/, "Only alphabetic characters are allowed")
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be at most 50 characters")
    .required("Name is required"),
  email: Yup.string().required("Email is required").email("Invalid email address"),
  city: Yup.string().required("City is required"),
  country: Yup.string().required("Select at least one option"),
  code: Yup.string()
    .required("Post Code is required")
    .matches(/^\d{5}$/, "Invalid postcode. It should be 5 digits."),
  address: Yup.string().required("Address is Required"),
});

export default function ClientsPage() {
  const [formData, setFormData] = useRecoilState(printclientdata);
  const [createClient, { isLoading }] = useCreateClientMutation();
  const [buttonUpdate, setButtonUpdate] = useState("");
  const [editingIndex, setEditingIndex] = useState(-1);

  const onSubmit = async (values, { resetForm }) => {
    if (editingIndex !== -1) {
      const storedData = JSON.parse(localStorage.getItem("clientData")) || [];
      storedData[editingIndex] = values;
      localStorage.setItem("clientData", JSON.stringify(storedData));
      setFormData(storedData);
      setEditingIndex(-1);
      setButtonUpdate("");
      toast.success("Updated Successfully");
      resetForm();
      return;
    }

    try {
      await createClient(values).unwrap();
      toast.success("Added Successfully");
      resetForm();
    } catch (err) {
      toast.error("Failed to add client");
    }
  };

  const handeleditbtn = (index) => {
    setEditingIndex(index);
    setButtonUpdate("Update");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        const storedData = JSON.parse(localStorage.getItem("clientData")) || [];
        storedData.splice(index, 1);
        localStorage.setItem("clientData", JSON.stringify(storedData));
        setFormData(storedData);
        toast.success("Deleted Successfully");
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        toast.error("Cancel Successfully");
      }
    });
  };

  return (
    <div className="page-wrap">
      <Formik
        initialValues={editingIndex !== -1 ? formData[editingIndex] : initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        enableReinitialize
      >
        <Form className="form-card">
          <h1 className="page-title">Add New Client</h1>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label htmlFor="name" className="form-label input-clr">
                Client Name:
              </label>
              <Field type="text" className="form-control input-settings" id="name" name="name" />
              <ErrorMessage name="name" component="div" className="text-danger fw-bold" />
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="Email" className="form-label input-clr">
                Client Email:
              </label>
              <Field
                type="email"
                className="form-control input-settings"
                id="Email"
                name="email"
              />
              <ErrorMessage name="email" component="div" className="text-danger fw-bold" />
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="Address" className="form-label input-clr">
                Street Address:
              </label>
              <Field
                type="text"
                className="form-control input-settings"
                id="Address"
                name="address"
              />
              <ErrorMessage name="address" component="div" className="text-danger fw-bold" />
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="City" className="form-label input-clr">
                City:
              </label>
              <Field type="text" id="City" className="form-control input-settings" name="city" />
              <ErrorMessage name="city" component="div" className="text-danger fw-bold" />
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="exampleFormControlTextarea1" className="form-label input-clr">
                Post Code:
              </label>
              <Field
                type="number"
                className="form-control input-settings"
                id="exampleFormControlTextarea1"
                name="code"
              />
              <ErrorMessage name="code" component="div" className="text-danger fw-bold" />
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="Country" className="form-label input-clr">
                Select Country:
              </label>
              <Field
                list="browsers"
                id="Country"
                className="form-control input-settings"
                name="country"
              />
              <CountryDatalist id="browsers" />
              <ErrorMessage name="country" component="div" className="text-danger fw-bold" />
            </div>
            <div className="col-12 col-md-6">
              <button
                type="submit"
                className="btn input-clr1 save-changes py-2 btn-responsive-width"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : buttonUpdate || "Submit"}
              </button>
            </div>
          </div>
        </Form>
      </Formik>

      <div className="mt-4">
        <ClientList clients={formData} onEdit={handeleditbtn} onDelete={handeldeletebtn} />
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
