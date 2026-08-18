import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format } from "date-fns";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useEffect, useMemo, useState } from "react";
import { useRecoilState } from "recoil";
import * as Yup from "yup";
import {
  editclicked,
  filterdatatom,
  formdisplay,
  idsend,
  printclientdata,
  productAtom,
} from "../../state/Atom";
import { calcLineTotal, generateRandomId } from "../../utils/invoice";

const validationSchema = Yup.object({
  address1: Yup.string()
    .required("Street address is required")
    .min(5, "Street address is too short")
    .max(100, "Street address is too long")
    .matches(/^[a-zA-Z0-9\s,'-]*$/, "Invalid characters in street address"),
  city1: Yup.string()
    .required("City is required")
    .matches(/^[a-zA-Z\s]+$/, "City must contain only letters and spaces"),
  code1: Yup.string()
    .matches(/^\d{5}$/, "Invalid postcode. It should be 5 digits.")
    .required("Postcode is required"),
  code2: Yup.string()
    .matches(/^\d{5}$/, "Invalid postcode. It should be 5 digits.")
    .required("Postcode is required"),
  city2: Yup.string()
    .required("City is required")
    .matches(/^[a-zA-Z\s]+$/, "City must contain only letters and spaces"),
  country1: Yup.string().required("Country is required"),
  name: Yup.string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be at most 50 characters")
    .required("Name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  address2: Yup.string()
    .required("Street address is required")
    .min(5, "Street address is too short")
    .max(100, "Street address is too long")
    .matches(/^[a-zA-Z0-9\s,'-]*$/, "Invalid characters in street address"),
  country2: Yup.string().required("Country is required"),
});

export default function InvoiceForm() {
  const [data1, setData1] = useState([{ id: 0 }]);
  const [, setProduct] = useRecoilState(productAtom);
  const [, setNewInvoice1] = useRecoilState(formdisplay);
  const [id, setId] = useRecoilState(idsend);
  const [filterdata] = useRecoilState(filterdatatom);
  const [editclick, setEditClick] = useRecoilState(editclicked);
  const [formData] = useRecoilState(printclientdata);
  const [currentDate, setCurrentDate] = useState(new Date());
  const randomId = useMemo(() => generateRandomId(), []);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    if (filterdata[0]?.numberOfItemsAdded) {
      const rows = Array.from(
        { length: filterdata[0].numberOfItemsAdded },
        (_, index) => ({ id: index })
      );
      setData1(rows);
    } else {
      setData1([{ id: 0 }]);
    }
  }, [filterdata]);

  const initialValues = {
    address1: "Ravi Road",
    city1: "Lahore",
    code1: "54000",
    country1: "Pakistan",
    name: "",
    email: "",
    address2: "",
    city2: "",
    code2: "",
    country2: "",
    date: format(currentDate, "yyyy-MM-dd"),
    datedue: format(currentDate, "yyyy-MM-dd"),
    description:
      "Tufail Traders offers a wide range of premium cosmetic products to enhance your beauty and style.",
    currency: "Rs",
    total: "",
  };

  const clearrow = (index) => {
    const newData = [...data1];
    newData.splice(index, 1);
    setData1(newData);
  };

  const addnew = () => {
    const nextId = data1.length ? Math.max(...data1.map((row) => row.id)) + 1 : 0;
    setData1([...data1, { id: nextId }]);
  };

  const overall = (values, action) => {
    try {
      validationSchema.validateSync(values, { abortEarly: false });
      values.btnCP = action;
      onsubmit(values);
    } catch (errors) {
      errors.inner?.forEach((error) => {
        console.error(`Path: ${error.path}, Message: ${error.message}`);
      });
    }
  };

  const onsubmit = (values) => {
    let grandTotal = 0;
    data1.forEach((elem) => {
      grandTotal += calcLineTotal(
        values[`quantity${elem.id}`],
        values[`price${elem.id}`],
        values[`tax${elem.id}`]
      );
    });

    values.total = grandTotal;
    values.id = filterdata[0]?.id || randomId;
    values.numberOfItemsAdded = data1.length;

    const storedIndex = localStorage.getItem("Index");

    if (editclick) {
      const storedData = JSON.parse(localStorage.getItem("invoiceData")) || [];
      storedData[storedIndex] = values;
      localStorage.setItem("invoiceData", JSON.stringify(storedData));
      setProduct(storedData);
      setEditClick(false);
    } else {
      const storeData = JSON.parse(localStorage.getItem("invoiceData")) || [];
      const invoiceData = [...storeData, values];
      setProduct(invoiceData);
      localStorage.setItem("invoiceData", JSON.stringify(invoiceData));
    }

    setNewInvoice1(false);
    setId([...id, values.id]);
  };

  const handleClientChange = (name, setValues, allValues) => {
    const match = formData.find((elem) => elem.name === name);

    if (match) {
      setValues({
        ...allValues,
        name: match.name,
        email: match.email,
        country2: match.country,
        code2: match.code,
        city2: match.city,
        address2: match.address,
      });
    } else if (!name) {
      setValues({
        ...allValues,
        name: "",
        email: "",
        country2: "",
        code2: "",
        city2: "",
        address2: "",
      });
    }
  };

  return (
    <Formik
      initialValues={filterdata.length ? filterdata[0] : initialValues}
      validationSchema={validationSchema}
      onSubmit={onsubmit}
      enableReinitialize
    >
      {({ values, handleChange, setValues }) => (
        <Form>
          <div
            className="invoice-drawer"
            onClick={() => setNewInvoice1(false)}
          >
            <div
              className="invoice-drawer-panel"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="edit-text">
                  <span style={{ color: "#7e829b" }}>#</span>
                  {filterdata.length ? filterdata[0].id : randomId}
                </div>
                <button
                  type="button"
                  className="btn cancel py-2 px-3 d-md-none"
                  onClick={() => setNewInvoice1(false)}
                >
                  Close
                </button>
              </div>

              <div className="bill-form mb-2">Bill From</div>
              <div className="mb-2">
                <label htmlFor="address1" className="input-clr mb-1">
                  Street Address
                </label>
                <Field
                  type="text"
                  name="address1"
                  className="form-control input-settings"
                  id="address1"
                />
                <ErrorMessage name="address1" component="div" className="text-danger" />
              </div>

              <div className="row g-2">
                <div className="col-12 col-md-4">
                  <label htmlFor="city1" className="input-clr mb-1">
                    City
                  </label>
                  <Field
                    name="city1"
                    type="text"
                    className="form-control input-settings"
                    id="city1"
                  />
                  <ErrorMessage name="city1" component="div" className="text-danger" />
                </div>
                <div className="col-6 col-md-4">
                  <label htmlFor="code1" className="input-clr mb-1">
                    Post Code
                  </label>
                  <Field
                    type="number"
                    name="code1"
                    className="form-control input-settings"
                    id="code1"
                  />
                  <ErrorMessage name="code1" component="div" className="text-danger" />
                </div>
                <div className="col-6 col-md-4">
                  <label htmlFor="country1" className="input-clr mb-1">
                    Country
                  </label>
                  <Field
                    type="text"
                    name="country1"
                    className="form-control input-settings"
                    id="country1"
                  />
                  <ErrorMessage name="country1" component="div" className="text-danger" />
                </div>
              </div>

              <div className="bill-form mt-4 mb-2">Bill To</div>
              <div className="mb-2">
                <label htmlFor="name" className="input-clr mb-1">
                  Client's Name
                </label>
                <Field
                  type="text"
                  name="name"
                  className="form-control input-settings"
                  id="name"
                  list="clientNames"
                  onChange={(event) => {
                    handleChange(event);
                    handleClientChange(event.target.value, setValues, values);
                  }}
                />
                <datalist id="clientNames">
                  {formData.map((client, index) => (
                    <option key={`${client.name}-${index}`} value={client.name} />
                  ))}
                </datalist>
                <ErrorMessage name="name" component="div" className="text-danger" />
              </div>

              <div className="mb-2">
                <label htmlFor="email" className="input-clr mb-1">
                  Client's Email
                </label>
                <Field
                  type="email"
                  name="email"
                  className="form-control input-settings placeholdercolor"
                  id="email"
                  placeholder="e.g. email@example.com"
                />
                <ErrorMessage name="email" component="div" className="text-danger" />
              </div>

              <div className="mb-2">
                <label htmlFor="address2" className="input-clr mb-1">
                  Street Address
                </label>
                <Field
                  type="text"
                  name="address2"
                  className="form-control input-settings"
                  id="address2"
                />
                <ErrorMessage name="address2" component="div" className="text-danger" />
              </div>

              <div className="row g-2">
                <div className="col-12 col-md-4">
                  <label htmlFor="city2" className="input-clr mb-1">
                    City
                  </label>
                  <Field
                    type="text"
                    name="city2"
                    className="form-control input-settings"
                    id="city2"
                  />
                  <ErrorMessage name="city2" component="div" className="text-danger" />
                </div>
                <div className="col-6 col-md-4">
                  <label htmlFor="code2" className="input-clr mb-1">
                    Post Code
                  </label>
                  <Field
                    type="number"
                    name="code2"
                    className="form-control input-settings"
                    id="code2"
                  />
                  <ErrorMessage name="code2" component="div" className="text-danger" />
                </div>
                <div className="col-6 col-md-4">
                  <label htmlFor="country2" className="input-clr mb-1">
                    Country
                  </label>
                  <Field
                    type="text"
                    name="country2"
                    className="form-control input-settings"
                    id="country2"
                  />
                  <ErrorMessage name="country2" component="div" className="text-danger" />
                </div>
              </div>

              <div className="row g-2 mt-3">
                <div className="col-12 col-md-6">
                  <label htmlFor="date" className="input-clr mb-1">
                    Invoice date
                  </label>
                  <Field
                    type="date"
                    name="date"
                    className="form-control input-settings"
                    id="date"
                    value={values.date}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label htmlFor="duedate" className="input-clr mb-1">
                    Due Date
                  </label>
                  <Field
                    type="date"
                    name="datedue"
                    className="form-control input-settings"
                    id="duedate"
                    onChange={handleChange}
                  />
                  <ErrorMessage name="datedue" component="div" className="text-danger" />
                </div>
              </div>

              <div className="mt-2">
                <label htmlFor="description" className="input-clr mb-1">
                  Description
                </label>
                <Field
                  type="text"
                  name="description"
                  className="form-control input-settings placeholdercolor"
                  id="description"
                  placeholder="e.g. Graphic Design Service"
                />
                <ErrorMessage name="description" component="div" className="text-danger" />
              </div>

              <div className="row g-2 mt-1">
                <div className="col-12 col-md-6">
                  <label htmlFor="currency" className="input-clr mb-1">
                    Currency
                  </label>
                  <Field
                    id="currency"
                    as="select"
                    name="currency"
                    className="form-select input-settings"
                  >
                    <option value="Rs">Rs</option>
                    <option value="₹">₹</option>
                    <option value="₣">₣</option>
                    <option value="¥">¥</option>
                    <option value="£">£</option>
                    <option value="$">$</option>
                  </Field>
                </div>
              </div>

              <div className="item-list mt-4 mb-2">Item List</div>
              <div className="row d-none d-md-flex mb-2">
                <div className="col-md-3 input-clr1">Item Name</div>
                <div className="col-md-2 input-clr1">Qty.</div>
                <div className="col-md-2 input-clr1">Price</div>
                <div className="col-md-2 input-clr1">Tax(%)</div>
                <div className="col-md-2 input-clr1 text-center">Total</div>
              </div>

              {data1.map((elem, index) => {
                const finalTotal = calcLineTotal(
                  values[`quantity${elem.id}`],
                  values[`price${elem.id}`],
                  values[`tax${elem.id}`]
                );

                return (
                  <div className="row g-2 align-items-end mb-3" key={elem.id}>
                    <div className="col-12 col-md-3">
                      <label className="d-md-none input-clr mb-1">Item Name</label>
                      <Field
                        type="text"
                        name={`item${elem.id}`}
                        className="form-control input-settings placeholdercolor"
                        placeholder="item name"
                      />
                    </div>
                    <div className="col-4 col-md-2">
                      <label className="d-md-none input-clr mb-1">Qty</label>
                      <Field
                        type="number"
                        name={`quantity${elem.id}`}
                        className="form-control input-settings placeholdercolor"
                        placeholder="qty"
                      />
                    </div>
                    <div className="col-4 col-md-2">
                      <label className="d-md-none input-clr mb-1">Price</label>
                      <Field
                        type="number"
                        name={`price${elem.id}`}
                        className="form-control input-settings placeholdercolor"
                        placeholder="price"
                      />
                    </div>
                    <div className="col-4 col-md-2">
                      <label className="d-md-none input-clr mb-1">Tax</label>
                      <Field
                        type="number"
                        name={`tax${elem.id}`}
                        className="form-control input-settings placeholdercolor"
                        placeholder="tax"
                      />
                    </div>
                    <div className="col-10 col-md-2 d-flex justify-content-between justify-content-md-center align-items-center py-2">
                      <span className="d-md-none input-clr">Total</span>
                      <span>{(finalTotal || 0).toFixed(0)}</span>
                    </div>
                    <div className="col-2 col-md-1 trash d-flex justify-content-end align-items-center pb-2">
                      <span className="cursor basket" onClick={() => clearrow(index)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </span>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                className="btn input-clr1 add-btn py-2 w-100"
                onClick={addnew}
              >
                + Add New Item
              </button>

              <div className="invoice-form-actions mt-4">
                <button
                  type="button"
                  onClick={() => setNewInvoice1(false)}
                  className="btn input-clr1 cancel py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn input-clr1 save py-2 px-3"
                  onClick={() => overall(values, 1)}
                >
                  Save
                </button>
                <button
                  type="submit"
                  className="btn input-clr1 save-changes py-2 px-3"
                  onClick={() => overall(values, 2)}
                >
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
