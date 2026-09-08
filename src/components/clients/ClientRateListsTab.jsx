import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Can } from "../../auth/guards";
import { PERMISSIONS } from "../../lib/permissions";
import { getErrorMessage } from "../../lib/rtkBaseQuery";
import { useGetClientRateListsQuery } from "../../services/invoiceApi";
import EmptyState from "../ui/EmptyState";
import RateListStatusBadge from "../rateLists/RateListStatusBadge";

export default function ClientRateListsTab({ clientId }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useGetClientRateListsQuery(clientId, {
    skip: !clientId,
  });
  const [q, setQ] = useState("");

  const rateLists = useMemo(() => data?.rateLists || [], [data?.rateLists]);

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Failed to load rate lists"));
  }, [isError, error]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rateLists;
    return rateLists.filter((list) =>
      `${list.number || ""} ${list.title || ""}`.toLowerCase().includes(term)
    );
  }, [rateLists, q]);

  return (
    <div>
      <div className="invoices-header">
        <p className="count-invoices-tect mb-0">
          {rateLists.length} rate list{rateLists.length === 1 ? "" : "s"} for this client
        </p>
        <div className="invoices-header-actions">
          <input
            className="form-control input-settings input-compact"
            placeholder="Search lists…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ minWidth: 160 }}
          />
          <Can permission={PERMISSIONS.RATE_LISTS_CREATE}>
            <Link
              to={`/rate-lists/new?clientId=${encodeURIComponent(clientId)}`}
              className="btn new-invoice"
            >
              <span className="circle-plus me-2">
                <FontAwesomeIcon icon={faCirclePlus} />
              </span>
              New rate list
            </Link>
          </Can>
        </div>
      </div>

      {isLoading ? (
        <p className="textcklr mt-4">Loading…</p>
      ) : !filtered.length ? (
        <EmptyState
          title="No rate lists yet"
          message="Create a list with custom rates for this client."
        />
      ) : (
        <div className="form-card product-list-card">
          <div className="product-table-scroll">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Title</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Sent</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((list) => (
                  <tr
                    key={list.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/rate-lists/${list.id}`)}
                  >
                    <td className="table-text-size">
                      <span className="hash-clr">#</span>
                      {list.number}
                    </td>
                    <td>{list.title || "—"}</td>
                    <td>{list.itemCount ?? 0}</td>
                    <td>
                      <RateListStatusBadge status={list.status} />
                    </td>
                    <td className="cell-muted">
                      {list.sentAt ? new Date(list.sentAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
