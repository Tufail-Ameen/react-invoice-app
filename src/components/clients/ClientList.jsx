export default function ClientList({ clients, onEdit, onDelete }) {
  if (!clients.length) {
    return (
      <p className="text-center textcklr py-4 mb-0">No clients added yet.</p>
    );
  }

  return (
    <>
      <div className="d-none d-md-block table-responsive">
        <table className="table table-striped">
          <thead>
            <tr className="head-settings">
              <th className="head-settings">#</th>
              <th className="head-settings">Name</th>
              <th className="head-settings">Email</th>
              <th className="head-settings">Address</th>
              <th className="head-settings">City</th>
              <th className="head-settings">Post Code</th>
              <th className="head-settings">Country</th>
              <th className="head-settings">Options</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, index) => (
              <tr key={`${client.email}-${index}`}>
                <td className="body-settings">{index + 1}</td>
                <td className="body-settings">{client.name}</td>
                <td className="body-settings">{client.email}</td>
                <td className="body-settings">{client.address}</td>
                <td className="body-settings">{client.city}</td>
                <td className="body-settings">{client.code}</td>
                <td className="body-settings">{client.country}</td>
                <td className="body-settings">
                  <div className="d-flex gap-2">
                    <button
                      onClick={() => onEdit(index)}
                      type="button"
                      className="btn edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(index)}
                      type="button"
                      className="btn delete"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-block d-md-none">
        {clients.map((client, index) => (
          <div key={`${client.email}-${index}`} className="data-card mb-3">
            <p className="mb-2">
              <strong className="text-accent">Name:</strong>
              <span className="ms-2">{client.name}</span>
            </p>
            <p className="mb-2">
              <strong className="text-accent">Email:</strong>
              <span className="ms-2">{client.email}</span>
            </p>
            <p className="mb-2">
              <strong className="text-accent">Address:</strong>
              <span className="ms-2">{client.address}</span>
            </p>
            <div className="row">
              <div className="col-6 mb-2">
                <strong className="text-accent">City:</strong>
                <span className="ms-2">{client.city}</span>
              </div>
              <div className="col-6 mb-2">
                <strong className="text-accent">Code:</strong>
                <span className="ms-2">{client.code}</span>
              </div>
            </div>
            <p className="mb-3">
              <strong className="text-accent">Country:</strong>
              <span className="ms-2">{client.country}</span>
            </p>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn edit flex-fill"
                onClick={() => onEdit(index)}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn delete flex-fill"
                onClick={() => onDelete(index)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
