import { faPrint } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Fragment } from "react";
import { Link, useParams } from "react-router-dom";
import { getErrorCode } from "../lib/rtkBaseQuery";
import { formatPrice } from "../lib/rateLists";
import { useGetPublicRateListQuery } from "../services/invoiceApi";

const COLUMNS = 3;

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

function chunkItems(items, size) {
  const rows = [];
  for (let i = 0; i < items.length; i += size) {
    const row = items.slice(i, i + size);
    while (row.length < size) row.push(null);
    rows.push(row);
  }
  return rows;
}

function ColumnHead() {
  return (
    <>
      <th>Product</th>
      <th className="public-rate-list-unit">Unit</th>
      <th className="public-rate-list-rate">Rate</th>
    </>
  );
}

function EmptyCells() {
  return (
    <>
      <td />
      <td className="public-rate-list-unit" />
      <td className="public-rate-list-rate" />
    </>
  );
}

function RateCells({ item }) {
  return (
    <>
      <td>{item.productName}</td>
      <td className="public-rate-list-unit">{item.unit || "pcs"}</td>
      <td className="public-rate-list-rate">
        {formatPrice(item.price ?? item.customPrice ?? item.defaultPrice)}
      </td>
    </>
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
  const rows = chunkItems(items, COLUMNS);
  const colIndexes = Array.from({ length: COLUMNS }, (_, i) => i);

  return (
    <div className="public-rate-list-page">
      <style>{`@page { size: A4 landscape; margin: 10mm; }`}</style>
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

        <table className="public-rate-list-table public-rate-list-table-split">
          <thead>
            <tr>
              {colIndexes.map((col) => (
                <Fragment key={`head-${col}`}>
                  {col > 0 ? <th className="public-rate-list-split-gap" aria-hidden="true" /> : null}
                  <ColumnHead />
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cols, index) => (
              <tr key={index}>
                {cols.map((item, col) => (
                  <Fragment key={`${index}-${col}`}>
                    {col > 0 ? <td className="public-rate-list-split-gap" aria-hidden="true" /> : null}
                    {item ? <RateCells item={item} /> : <EmptyCells />}
                  </Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
