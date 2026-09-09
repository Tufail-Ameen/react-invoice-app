import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Can } from "../auth/guards";
import { useAuth } from "../auth/AuthContext";
import CatalogRatesCard from "../components/rateLists/CatalogRatesCard";
import RateListStatusBadge from "../components/rateLists/RateListStatusBadge";
import EmptyState from "../components/ui/EmptyState";
import FilterMenu from "../components/ui/FilterMenu";
import { useClients } from "../hooks/useClients";
import { PERMISSIONS } from "../lib/permissions";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import { useGetProductsQuery, useGetRateListsQuery } from "../services/invoiceApi";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Sent", value: "SENT" },
  { label: "Archived", value: "ARCHIVED" },
];

export default function RateListsPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const { clients } = useClients();
  const [statusFilter, setStatusFilter] = useState("");
  const [clientId, setClientId] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const next = { page, limit: 50 };
    if (statusFilter) next.status = statusFilter;
    if (clientId) next.clientId = clientId;
    if (q.trim()) next.q = q.trim();
    return next;
  }, [statusFilter, clientId, q, page]);

  const { data, isLoading, isError, error } = useGetRateListsQuery(params);
  const { data: productsData, isLoading: catalogLoading } = useGetProductsQuery(
    { status: "active" },
    { skip: !can(PERMISSIONS.PRODUCTS_VIEW) }
  );
  const rateLists = data?.rateLists || [];
  const pagination = data?.pagination;
  const catalogProducts = productsData?.products || [];

  useEffect(() => {
    setPage(1);
  }, [statusFilter, clientId, q]);

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, "Failed to load rate lists"));
  }, [isError, error]);

  return (
    <div className="page-wrap">
      <div className="invoices-header">
        <p className="count-invoices-tect mb-0">
          There {rateLists.length === 1 ? "is" : "are"} {pagination?.total ?? rateLists.length} total
          Rate lists
        </p>
        <div className="invoices-header-actions">
          <input
            className="form-control input-settings input-compact"
            placeholder="Search title or number…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ minWidth: 160 }}
          />
          <select
            className="form-select input-settings input-compact"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            aria-label="Filter by client"
          >
            <option value="">All clients</option>
            {clients.map((client) => (
              <option key={client.key || client.id} value={String(client.id)}>
                {client.name}
              </option>
            ))}
          </select>
          <FilterMenu
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <Can permission={PERMISSIONS.RATE_LISTS_CREATE}>
            <Link to="/rate-lists/new" className="btn new-invoice">
              <span className="circle-plus me-2">
                <FontAwesomeIcon icon={faCirclePlus} />
              </span>
              New rate list
            </Link>
          </Can>
        </div>
      </div>

      <CatalogRatesCard products={catalogProducts} isLoading={catalogLoading} />

      <h2 className="product-list-heading mb-2">Client rate lists</h2>

      {isLoading ? (
        <p className="textcklr mt-4">Loading…</p>
      ) : !rateLists.length ? (
        <EmptyState
          title="No client lists yet"
          message="Use the default catalog above, then save a list for a client."
        />
      ) : (
        <div className="form-card product-list-card">
          <div className="product-table-scroll">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Sent</th>
                </tr>
              </thead>
              <tbody>
                {rateLists.map((list) => (
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
                    <td>{list.clientName || `Client #${list.clientId}`}</td>
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

      {pagination?.pages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            type="button"
            className="btn cancel py-1 px-3"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="textcklr small">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            type="button"
            className="btn cancel py-1 px-3"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
