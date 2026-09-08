import { faPrint } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useParams } from "react-router-dom";
import { getErrorCode } from "../lib/rtkBaseQuery";
import { formatPrice } from "../lib/rateLists";
import { useGetPublicRateListQuery } from "../services/invoiceApi";

function PublicState({ title, message }) {
  return (
    <div className="public-rate-list-page">
      <div className="public-rate-list public-rate-list-empty">
        <h1>{title}</h1>
        <p>{message}</p>
        <Link to="/login" className="btn save-changes py-2 px-4">
          Go to login
        </Link>
      </div>
    </div>
  );
}

export default function PublicRateListPage() {
  const { token } = useParams();
  const { data: list, isLoading, isError, error } = useGetPublicRateListQuery(token, {
    skip: !token,
  });

  if (isLoading) {
    return (
      <div className="public-rate-list-page">
        <p className="textcklr">Loading rate list…</p>
      </div>
    );
  }

  if (isError || !list) {
    const code = getErrorCode(error);
    const expired = error?.status === 410 || code === "SHARE_LINK_EXPIRED";
    if (expired) {
      return (
        <PublicState
          title="Link expired"
          message="This rate list link is no longer valid. Ask the sender for a new one."
        />
      );
    }
    return (
      <PublicState
        title="Link invalid"
        message="This share link was not found. Check the URL or ask for a new list."
      />
    );
  }

  const items = list.items || [];

  return (
    <div className="public-rate-list-page">
      <article className="public-rate-list">
        <header className="public-rate-list-head">
          <div>
            <p className="public-rate-list-kicker">{list.number}</p>
            <h1>{list.title || "Rate list"}</h1>
            {list.clientName ? <p className="public-rate-list-client">{list.clientName}</p> : null}
            {list.sentAt ? (
              <p className="public-rate-list-date">
                Sent {new Date(list.sentAt).toLocaleDateString()}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="btn save-changes py-2 px-3 no-print"
            onClick={() => window.print()}
          >
            <FontAwesomeIcon icon={faPrint} className="me-1" />
            Print
          </button>
        </header>

        <table className="public-rate-list-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Unit</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${item.productName}-${index}`}>
                <td>{item.productName}</td>
                <td>{item.unit || "pcs"}</td>
                <td>{formatPrice(item.price ?? item.customPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
