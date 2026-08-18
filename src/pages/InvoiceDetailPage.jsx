import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilState, useSetRecoilState } from "recoil";
import InvoiceForm from "../components/invoices/InvoiceForm";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import {
  editclicked,
  filterdatatom,
  formdisplay,
  productAtom,
} from "../state/Atom";
import { formatAmount, getInvoiceItems } from "../utils/invoice";

export default function InvoiceDetailPage() {
  const { index } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useRecoilState(productAtom);
  const [showForm, setShowForm] = useRecoilState(formdisplay);
  const [filterdata, setFilterdata] = useRecoilState(filterdatatom);
  const setEditClick = useSetRecoilState(editclicked);
  const [rowPrint, setRowPrint] = useState([]);
  const invoiceIndex = parseInt(index, 10);
  const invoice = product[invoiceIndex];

  useEffect(() => {
    if (!invoice) {
      setFilterdata([]);
      setRowPrint([]);
      return;
    }
    localStorage.setItem("Index", String(invoiceIndex));
    setFilterdata([invoice]);
    setRowPrint(getInvoiceItems(invoice));
  }, [invoice, invoiceIndex, setFilterdata]);

  const handeldeletebtn = () => {
    const filteredProduct = product.filter((_, idx) => idx !== invoiceIndex);
    setProduct(filteredProduct);
    localStorage.setItem("invoiceData", JSON.stringify(filteredProduct));
    navigate("/");
  };

  const updatehandler = () => {
    setEditClick(true);
    setShowForm(true);
  };

  const statuspaid = () => {
    const arrayCopy = JSON.parse(JSON.stringify(product));
    arrayCopy[invoiceIndex].btnCP = 3;
    setProduct(arrayCopy);
    localStorage.setItem("invoiceData", JSON.stringify(arrayCopy));
  };

  if (!invoice) {
    return (
      <EmptyState
        title="Invoice not found"
        message="This invoice does not exist or was deleted."
      />
    );
  }

  return (
    <div className="page-wrap invoice-detail">
      <button type="button" className="back-link" onClick={() => navigate("/")}>
        <FontAwesomeIcon className="icon me-2" icon={faAngleLeft} size="2xs" />
        Go back
      </button>

      <div className="detail-toolbar">
        <div className="d-flex align-items-center gap-3">
          <span className="edit-discription mb-0">Status</span>
          <StatusBadge status={filterdata[0]?.btnCP} />
        </div>
        <div className="detail-actions">
          <button type="button" className="btn input-clr1 edit py-2 px-3" onClick={updatehandler}>
            Edit
          </button>
          <button
            type="button"
            className="btn input-clr1 delete py-2 px-3"
            onClick={handeldeletebtn}
          >
            Delete
          </button>
          <button
            type="button"
            className="btn input-clr1 mark-paid py-2 px-3"
            onClick={statuspaid}
          >
            Mark as Paid
          </button>
        </div>
      </div>

      <div className="detail-card">
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <p className="edit-id">#{invoice.id}</p>
            <p className="edit-discription">{invoice.description}</p>
          </div>
          <div className="col-12 col-md-6 text-md-end">
            <p className="p-0 m-0 line-height">{invoice.address1},</p>
            <p className="p-0 m-0 line-height">{invoice.city1},</p>
            <p className="p-0 m-0 line-height">{invoice.code1},</p>
            <p className="p-0 m-0 line-height">{invoice.country1}</p>
          </div>
        </div>

        <div className="row g-4 mt-2">
          <div className="col-6 col-md-3">
            <span className="d-block edit-discription">Invoice Date</span>
            <span className="d-block date-bill-email">{invoice.date}</span>
            <span className="d-block edit-discription mt-4">Payment Due</span>
            <span className="d-block date-bill-email">{invoice.datedue}</span>
          </div>
          <div className="col-6 col-md-4">
            <span className="d-block edit-discription">Bill To</span>
            <span className="d-block date-bill-email">{invoice.name}</span>
            <p className="p-0 m-0 mt-2 line-height">{invoice.address2},</p>
            <p className="p-0 m-0 line-height">{invoice.city2},</p>
            <p className="p-0 m-0 line-height">{invoice.code2},</p>
            <p className="p-0 m-0 line-height">{invoice.country2}</p>
          </div>
          <div className="col-12 col-md-5">
            <span className="d-block edit-discription">Sent to</span>
            <span className="d-block date-bill-email">{invoice.email}</span>
          </div>
        </div>

        <div className="table-responsive table-setting my-4">
          <table className="table m-0">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Qty.</th>
                <th>Price</th>
                <th>Tax(%)</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rowPrint.map((elem, rowIndex) => (
                <tr key={`${elem.item}-${rowIndex}`}>
                  <td>{elem.item}</td>
                  <td>{elem.quantity}</td>
                  <td>{formatAmount(invoice.currency, elem.price)}</td>
                  <td>{elem.tax}%</td>
                  <td>{formatAmount(invoice.currency, elem.finalTotal)}</td>
                </tr>
              ))}
              <tr className="total">
                <th className="py-4 px-2" colSpan={4}>
                  Amount Due
                </th>
                <th className="total-price">
                  {formatAmount(
                    invoice.currency,
                    rowPrint.reduce((total, elem) => total + (elem.finalTotal || 0), 0)
                  )}
                </th>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <InvoiceForm />}
    </div>
  );
}
