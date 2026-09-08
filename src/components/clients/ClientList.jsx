import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Can } from "../../auth/guards";
import { useClients } from "../../hooks/useClients";
import EmptyState from "../ui/EmptyState";

function formatCell(value) {
  if (value === null || value === undefined || value === "") return "—";
  return value;
}

/**
 * Clients list — data GET /clients se aati hai (useClients hook).
 */
export default function ClientList({
  onEdit,
  onDelete,
  canEditPermission,
  canDeletePermission,
}) {
  const { clients, isLoading } = useClients();

  if (isLoading) {
    return <p className="textcklr">Loading…</p>;
  }

  if (!clients.length) {
    return <EmptyState title="No clients yet" message="Add a client to bill invoices." />;
  }

  const editButton = (client) => (
    <button
      type="button"
      className="btn btn-table-edit"
      onClick={() => onEdit?.(client)}
      title="Edit client"
    >
      <FontAwesomeIcon icon={faPen} />
      Edit
    </button>
  );

  const deleteButton = (client) => (
    <button
      type="button"
      className="btn btn-table-remove"
      onClick={() => onDelete?.(client)}
      title="Remove client"
    >
      <FontAwesomeIcon icon={faTrash} />
      Remove
    </button>
  );

  return (
    <div className="form-card product-list-card">
      <div className="product-table-scroll">
        <table className="product-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>City</th>
              <th>Post code</th>
              <th>Country</th>
              <th className="text-end col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.key || client._id || client.id}>
                <td className="table-text-size">{formatCell(client.name)}</td>
                <td className="cell-muted">{formatCell(client.email)}</td>
                <td>{formatCell(client.address)}</td>
                <td>
                  {client.city ? (
                    <span className="category-badge">{client.city}</span>
                  ) : (
                    <span className="cell-muted">—</span>
                  )}
                </td>
                <td>{formatCell(client.code)}</td>
                <td className="cell-muted">{formatCell(client.country)}</td>
                <td className="col-actions">
                  <div className="table-actions">
                    {canEditPermission ? (
                      <Can permission={canEditPermission}>{editButton(client)}</Can>
                    ) : (
                      editButton(client)
                    )}
                    {canDeletePermission ? (
                      <Can permission={canDeletePermission}>{deleteButton(client)}</Can>
                    ) : (
                      deleteButton(client)
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
