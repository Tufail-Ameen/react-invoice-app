import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { useRecoilState, useSetRecoilState } from "recoil";
import InvoiceForm from "../components/invoices/InvoiceForm";
import InvoiceList from "../components/invoices/InvoiceList";
import {
  editclicked,
  filterdatatom,
  formdisplay,
  productAtom,
} from "../state/Atom";

export default function InvoicesPage() {
  const [product] = useRecoilState(productAtom);
  const [showForm, setShowForm] = useRecoilState(formdisplay);
  const setFilterdata = useSetRecoilState(filterdatatom);
  const setEditClick = useSetRecoilState(editclicked);
  const [filterdata, setFilteredInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => {
    if (statusFilter == null) {
      setFilteredInvoices(product.map((item, originalIndex) => ({ ...item, originalIndex })));
      return;
    }
    setFilteredInvoices(
      product
        .map((item, originalIndex) => ({ ...item, originalIndex }))
        .filter((item) => item.btnCP === statusFilter)
    );
  }, [product, statusFilter]);

  const openinvoice = () => {
    setFilterdata([]);
    setEditClick(false);
    setShowForm(true);
  };

  return (
    <div className="page-wrap">
      <div className="invoices-header">
        <div>
          <h1 className="invoice-text mb-1">Invoices</h1>
          <p className="count-invoices-tect mb-0">
            There are {product.length} total Invoices
          </p>
        </div>

        <div className="invoices-header-actions">
          <Dropdown>
            <Dropdown.Toggle
              className="btn filter p-0"
              id="dropdown-basic"
              style={{ border: "none", background: "none" }}
            >
              <span className="mx-2">Filter by status</span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="menuclr px-0 py-2 mt-3">
              {[
                { label: "All", value: null, id: "filter-all" },
                { label: "Draft", value: 1, id: "filter-draft" },
                { label: "Pending", value: 2, id: "filter-pending" },
                { label: "Paid", value: 3, id: "filter-paid" },
              ].map((option) => (
                <Dropdown.Item as="div" className="menuitem p-0 m-0" key={option.id}>
                  <div
                    className="row p-0 m-0 ms-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="col-2 py-2">
                      <input
                        type="radio"
                        id={option.id}
                        className="input-size"
                        name="invoice-status-filter"
                        checked={statusFilter === option.value}
                        onChange={() => setStatusFilter(option.value)}
                      />
                    </div>
                    <div className="col-10 px-1 py-2">
                      <label className="cursor" htmlFor={option.id}>
                        {option.label}
                      </label>
                    </div>
                  </div>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <button type="button" className="new-invoice-btn" onClick={openinvoice}>
            <FontAwesomeIcon icon={faCirclePlus} style={{ fontSize: "22px" }} />
            <span className="mx-2">New Invoice</span>
          </button>
        </div>
      </div>

      <InvoiceList invoices={filterdata} />
      {showForm && <InvoiceForm />}
    </div>
  );
}
